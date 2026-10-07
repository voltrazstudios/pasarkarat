'use server';

import sharp from 'sharp';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { configured, db } from '@/lib/supabase';
import { cleanPlainText, containsBlockedContent, containsUnsafeMarkup } from '@/lib/moderation';

const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const IMAGE_TYPES=new Set(['image/png','image/jpeg','image/webp']);
const MAX_BANNER_BYTES=5*1024*1024;

export type StoreCustomizationResult={error?:string;message?:string};

export async function setSellerFollow(f:FormData){
  const sellerId=String(f.get('seller_id')||'');
  const follow=String(f.get('follow')||'')==='true';
  if(!uuid.test(sellerId))redirect('/items');
  if(!configured())redirect(`/seller/${sellerId}?error=unavailable`);

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect(`/auth?next=${encodeURIComponent(`/seller/${sellerId}`)}`);

  const result=await client.rpc('marketplace_set_follow',{p_seller:sellerId,p_follow:follow});
  if(result.error)redirect(`/seller/${sellerId}?error=follow`);

  revalidatePath(`/seller/${sellerId}`);
  revalidatePath('/items');
  redirect(`/seller/${sellerId}`);
}

async function cleanBanner(file:File){
  if(file.size>MAX_BANNER_BYTES)throw new Error('Shop banner must be 5 MB or smaller.');
  if(!IMAGE_TYPES.has(file.type))throw new Error('Use a PNG, JPG, or WebP banner.');

  const input=Buffer.from(await file.arrayBuffer());
  try{
    const metadata=await sharp(input,{failOn:'error',limitInputPixels:40000000}).metadata();
    if(!metadata.width||!metadata.height||metadata.width>10000||metadata.height>10000)throw new Error('bad dimensions');

    return await sharp(input,{failOn:'error',limitInputPixels:40000000})
      .rotate()
      .resize(1800,600,{fit:'cover',position:'centre',withoutEnlargement:false})
      .webp({quality:88})
      .toBuffer();
  }catch{
    throw new Error('The selected banner could not be safely processed.');
  }
}

export async function saveStoreCustomization(_:StoreCustomizationResult,form:FormData):Promise<StoreCustomizationResult>{
  if(!configured())return {error:'Store customization is unavailable right now.'};

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)return {error:'Your session has expired. Please sign in again.'};

  const sections:{name:string;product_ids:string[]}[]=[];
  const usedNames=new Set<string>();

  for(let index=0;index<3;index++){
    const raw=String(form.get(`section_name_${index}`)||'');
    if(!raw.trim())continue;

    const name=cleanPlainText(raw);
    if(name.length<2||name.length>40||containsUnsafeMarkup(name)||containsBlockedContent(name)){
      return {error:'Section names must be safe and between 2 and 40 characters.'};
    }
    const normalized=name.toLocaleLowerCase('en');
    if(usedNames.has(normalized))return {error:'Each custom section needs a different name.'};
    usedNames.add(normalized);

    const productIds=[...new Set(form.getAll(`section_product_${index}`).map(String).filter(value=>uuid.test(value)))];
    sections.push({name,product_ids:productIds});
  }

  const {data:profile,error:profileError}=await client.from('marketplace_profiles')
    .select('banner_path')
    .eq('id',user.id)
    .maybeSingle();
  if(profileError)return {error:'Unable to load your current store.'};

  const oldBanner=profile?.banner_path||null;
  let bannerPath=oldBanner;
  let uploadedBanner:string|null=null;

  try{
    const banner=form.get('banner');
    if(banner instanceof File&&banner.size>0){
      const body=await cleanBanner(banner);
      uploadedBanner=`${user.id}/banner-${crypto.randomUUID()}.webp`;
      const uploaded=await client.storage.from('marketplace-profile-images')
        .upload(uploadedBanner,body,{contentType:'image/webp',upsert:false,cacheControl:'31536000'});
      if(uploaded.error)throw new Error('Unable to upload your shop banner.');
      bannerPath=uploadedBanner;
    }

    if(form.has('remove_banner'))bannerPath=null;

    const saved=await client.rpc('marketplace_save_store_customization',{
      p_banner_path:bannerPath,
      p_sections:sections,
    });
    if(saved.error||saved.data!==true)throw new Error('Unable to save your store customization.');

    if(oldBanner&&oldBanner!==bannerPath){
      await client.storage.from('marketplace-profile-images').remove([oldBanner]);
    }
    if(uploadedBanner&&uploadedBanner!==bannerPath){
      await client.storage.from('marketplace-profile-images').remove([uploadedBanner]);
    }
  }catch(error){
    if(uploadedBanner)await client.storage.from('marketplace-profile-images').remove([uploadedBanner]);
    return {error:error instanceof Error?error.message:'Unable to save your store customization.'};
  }

  revalidatePath(`/seller/${user.id}`);
  return {message:'Store customization saved.'};
}
