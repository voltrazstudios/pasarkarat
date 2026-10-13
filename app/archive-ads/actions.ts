'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { archiveEntries } from '@/data/archive';
import { BillplzRequestError, billplzConfigured, createBillplzBill } from '@/lib/billplz';
import { configured, db } from '@/lib/supabase';
import { serviceConfigured, serviceDb } from '@/lib/supabase-service';

const UUID_RE=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

const plans={
  3:{amount:390,label:'Archive Ads — 3 days'},
  7:{amount:690,label:'Archive Ads — 7 days'},
  14:{amount:1190,label:'Archive Ads — 14 days'},
} as const;

export async function submitArchiveAd(form:FormData){
  if(!configured())redirect('/archive-ads?error=not-configured');

  const productId=String(form.get('product_id')||'');
  const archiveSlug=String(form.get('archive_slug')||'');

  if(!UUID_RE.test(productId))redirect('/archive-ads?error=product');
  if(!archiveEntries.some(entry=>entry.slug===archiveSlug))redirect('/archive-ads?error=archive');

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth?next=/archive-ads');

  const product=await client.from('marketplace_products')
    .select('id')
    .eq('id',productId)
    .eq('submitted_by',user.id)
    .eq('status','approved')
    .maybeSingle();

  if(product.error||!product.data)redirect('/archive-ads?error=product');

  const submitted=await client.rpc('submit_marketplace_archive_ad',{
    p_product_id:productId,
    p_archive_slug:archiveSlug,
  });

  if(submitted.error){
    const duplicate=submitted.error.message.toLowerCase().includes('duplicate');
    redirect('/archive-ads?error='+(duplicate?'duplicate':'submit'));
  }

  revalidatePath('/archive-ads');
  redirect('/archive-ads?submitted=1');
}

export async function startArchiveAdCheckout(form:FormData){
  if(!configured())redirect('/archive-ads?error=not-configured');

  const archiveAdId=String(form.get('archive_ad_id')||'');
  const duration=Number(String(form.get('duration_days')||''));
  const slots=Number(String(form.get('weight_units')||'1'));

  if(!UUID_RE.test(archiveAdId))redirect('/archive-ads?error=invalid-ad');
  if(duration!==3&&duration!==7&&duration!==14)redirect('/archive-ads?error=duration');
  if(!Number.isInteger(slots)||slots<1||slots>5)redirect('/archive-ads?error=slots');

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth?next=/archive-ads');
  if(!user.email)redirect('/archive-ads?error=email-required');
  if(!billplzConfigured()||!serviceConfigured())redirect('/archive-ads?error=payment-not-configured');

  const ad=await client.from('marketplace_archive_ads')
    .select('id,archive_slug,status,product_id,marketplace_products(name)')
    .eq('id',archiveAdId)
    .eq('submitted_by',user.id)
    .eq('status','approved')
    .maybeSingle();

  if(ad.error||!ad.data)redirect('/archive-ads?error=invalid-ad');

  const archiveEntry=archiveEntries.find(entry=>entry.slug===ad.data.archive_slug);
  if(!archiveEntry)redirect('/archive-ads?error=archive');

  const {data:profile}=await client.from('marketplace_profiles')
    .select('display_name,full_name')
    .eq('id',user.id)
    .maybeSingle();

  const plan=duration===3?plans[3]:duration===7?plans[7]:plans[14];
  const amount=plan.amount*slots;
  const productName=Array.isArray(ad.data.marketplace_products)
    ? ad.data.marketplace_products[0]?.name
    : (ad.data.marketplace_products as {name?:string}|null)?.name;

  let checkoutUrl='';
  let stage:'billplz'|'database'='billplz';

  try{
    const bill=await createBillplzBill({
      amount,
      email:user.email,
      name:profile?.full_name||profile?.display_name||'Pasar Karat Seller',
      description:`${plan.label} · ${archiveEntry.name} · ${slots} rotation ${slots===1?'slot':'slots'} · ${productName||'Product'}`,
      callbackPath:'/api/billplz/archive-ads/callback',
      redirectPath:'/archive-ads?payment=processing',
    });

    stage='database';
    const admin=serviceDb();
    const registered=await admin.from('marketplace_archive_ad_placements').insert({
      bill_id:bill.id,
      archive_ad_id:archiveAdId,
      user_id:user.id,
      amount,
      duration_days:duration,
      weight_units:slots,
      status:'due',
    });

    if(registered.error)throw new Error('Unable to register archive ad payment.');
    checkoutUrl=bill.url;
  }catch(error){
    console.error('[Archive ad checkout] failed',{stage,error});
    if(error instanceof BillplzRequestError)redirect('/archive-ads?error=billplz&status='+error.status);
    redirect('/archive-ads?error='+(stage==='database'?'payment-database':'payment'));
  }

  redirect(checkoutUrl);
}
