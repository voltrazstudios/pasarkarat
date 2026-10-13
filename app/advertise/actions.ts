'use server';

import sharp from 'sharp';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { BillplzRequestError, billplzConfigured, createBillplzBill } from '@/lib/billplz';
import { configured, db } from '@/lib/supabase';
import { serviceConfigured, serviceDb } from '@/lib/supabase-service';

const UUID_RE=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const MAX_IMAGE_BYTES=5*1024*1024;

const adPlans={
  3:{amount:690,label:'Banner Advertising — 3 days'},
  7:{amount:1290,label:'Banner Advertising — 7 days'},
  14:{amount:2190,label:'Banner Advertising — 14 days'},
} as const;

async function cleanAdImage(file:File,kind:'desktop'|'mobile'){
  if(file.size<=0||file.size>MAX_IMAGE_BYTES)throw new Error('Each banner image must be 5 MB or smaller.');

  const extension=file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]||'';
  if(!['png','jpg','jpeg','webp'].includes(extension))throw new Error('Use PNG, JPG, JPEG or WebP banner images.');

  const input=Buffer.from(await file.arrayBuffer());
  const metadata=await sharp(input,{failOn:'error',limitInputPixels:40000000}).metadata();
  const detected=metadata.format;
  if(!metadata.width||!metadata.height||metadata.width>12000||metadata.height>12000)throw new Error('Invalid banner image dimensions.');
  if(!['png','jpeg','webp'].includes(detected||''))throw new Error('The uploaded banner is not a supported image.');

  const mimeForFormat:Record<string,string>={png:'image/png',jpeg:'image/jpeg',webp:'image/webp'};
  if(file.type!==mimeForFormat[detected!])throw new Error('The banner file type does not match its contents.');
  if((detected==='jpeg'&&!['jpg','jpeg'].includes(extension))||(detected!=='jpeg'&&extension!==detected))
    throw new Error('The banner extension does not match its contents.');

  const target=kind==='desktop'?{width:1800,height:600}:{width:1200,height:900};
  return sharp(input,{failOn:'error',limitInputPixels:40000000})
    .rotate()
    .resize({...target,fit:'cover',position:'centre'})
    .webp({quality:90})
    .toBuffer();
}

function validDestination(value:string){
  try{
    const url=new URL(value.trim());
    if(url.protocol!=='https:'||url.username||url.password)return null;
    return url.toString();
  }catch{
    return null;
  }
}

export async function submitAd(form:FormData){
  if(!configured())redirect('/advertise?error=not-configured');

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth?next=/advertise');
  const userId=user.id;

  const title=String(form.get('title')||'').trim();
  const destination=validDestination(String(form.get('destination_url')||''));
  const desktop=form.get('desktop_image');
  const mobile=form.get('mobile_image');

  if(title.length<3||title.length>100)redirect('/advertise?error=title');
  if(!destination)redirect('/advertise?error=url');
  if(!(desktop instanceof File)||desktop.size===0)redirect('/advertise?error=desktop-image');
  if(!(mobile instanceof File)||mobile.size===0)redirect('/advertise?error=mobile-image');

  const uploaded:string[]=[];
  async function upload(file:File,kind:'desktop'|'mobile'){
    const cleaned=await cleanAdImage(file,kind);
    const path=`${userId}/${crypto.randomUUID()}.webp`;
    const result=await client.storage.from('marketplace-ad-submissions')
      .upload(path,cleaned,{contentType:'image/webp',upsert:false,cacheControl:'3600'});
    if(result.error)throw new Error('Unable to upload banner image.');
    uploaded.push(path);
    return path;
  }

  let desktopPath='';
  let mobilePath='';
  try{
    desktopPath=await upload(desktop,'desktop');
    mobilePath=await upload(mobile,'mobile');
  }catch(error){
    if(uploaded.length)await client.storage.from('marketplace-ad-submissions').remove(uploaded);
    redirect('/advertise?error='+encodeURIComponent(error instanceof Error?error.message:'image'));
  }

  const submitted=await client.rpc('submit_marketplace_ad',{
    p_title:title,
    p_destination_url:destination,
    p_desktop_path:desktopPath,
    p_mobile_path:mobilePath,
  });

  if(submitted.error){
    await client.storage.from('marketplace-ad-submissions').remove(uploaded);
    redirect('/advertise?error=submit');
  }

  revalidatePath('/advertise');
  redirect('/advertise?submitted=1');
}

export async function startAdCheckout(form:FormData){
  if(!configured())redirect('/advertise?error=not-configured');

  const adId=String(form.get('ad_id')||'');
  const duration=Number(String(form.get('duration_days')||''));
  const slots=Number(String(form.get('weight_units')||''));

  if(!UUID_RE.test(adId))redirect('/advertise?error=invalid-ad');
  if(duration!==3&&duration!==7&&duration!==14)redirect('/advertise?error=duration');
  if(!Number.isInteger(slots)||slots<1||slots>5)redirect('/advertise?error=slots');

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth?next=/advertise');
  if(!user.email)redirect('/advertise?error=email-required');
  if(!billplzConfigured()||!serviceConfigured())redirect('/advertise?error=payment-not-configured');

  const ad=await client.from('marketplace_ads')
    .select('id,title,status')
    .eq('id',adId)
    .eq('submitted_by',user.id)
    .eq('status','approved')
    .maybeSingle();

  if(ad.error||!ad.data)redirect('/advertise?error=invalid-ad');

  const {data:profile}=await client.from('marketplace_profiles')
    .select('display_name,full_name')
    .eq('id',user.id)
    .maybeSingle();

  const plan=duration===3?adPlans[3]:duration===7?adPlans[7]:adPlans[14];
  const amount=plan.amount*slots;
  let checkoutUrl='';
  let stage:'billplz'|'database'='billplz';

  try{
    const bill=await createBillplzBill({
      amount,
      email:user.email,
      name:profile?.full_name||profile?.display_name||'Pasar Karat Advertiser',
      description:`${plan.label} · ${slots} rotation ${slots===1?'slot':'slots'} · ${ad.data.title}`,
      callbackPath:'/api/billplz/ads/callback',
      redirectPath:'/advertise?payment=processing',
    });

    stage='database';
    const admin=serviceDb();
    const registered=await admin.from('marketplace_ad_placements').insert({
      bill_id:bill.id,
      ad_id:adId,
      user_id:user.id,
      amount,
      duration_days:duration,
      weight_units:slots,
      status:'due',
    });
    if(registered.error)throw new Error('Unable to register ad payment.');

    checkoutUrl=bill.url;
  }catch(error){
    console.error('[Ad checkout] failed',{stage,error});
    if(error instanceof BillplzRequestError)redirect('/advertise?error=billplz&status='+error.status);
    redirect('/advertise?error='+(stage==='database'?'payment-database':'payment'));
  }

  redirect(checkoutUrl);
}
