'use server';

import sharp from 'sharp';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { configured, db } from '@/lib/supabase';
import { cleanPlainText, containsBlockedContent, containsUnsafeMarkup } from '@/lib/moderation';

const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const IMAGE_TYPES=new Set(['image/png','image/jpeg','image/webp']);
const MAX_BANNER_BYTES=5*1024*1024;
const MAX_SECTION_IMAGE_BYTES=5*1024*1024;

export type StoreCustomizationResult={
  error?:string;
  message?:string;
  imagePaths?:(string|null)[][];
};

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

async function cleanImage(file:File,kind:'banner'|'section'){
  const maxBytes=kind==='banner'?MAX_BANNER_BYTES:MAX_SECTION_IMAGE_BYTES;
  if(file.size>maxBytes)throw new Error(kind==='banner'?'Shop banner must be 5 MB or smaller.':'Section images must be 5 MB or smaller.');
  if(!IMAGE_TYPES.has(file.type))throw new Error('Use a PNG, JPG, or WebP image.');

  const input=Buffer.from(await file.arrayBuffer());
  try{
    const metadata=await sharp(input,{failOn:'error',limitInputPixels:40000000}).metadata();
    if(!metadata.width||!metadata.height||metadata.width>10000||metadata.height>10000)throw new Error('bad dimensions');

    if(kind==='banner'){
      return await sharp(input,{failOn:'error',limitInputPixels:40000000})
        .rotate()
        .resize(1800,600,{fit:'cover',position:'centre',withoutEnlargement:false})
        .webp({quality:88})
        .toBuffer();
    }

    return await sharp(input,{failOn:'error',limitInputPixels:40000000})
      .rotate()
      .resize({width:1600,height:1200,fit:'inside',withoutEnlargement:true})
      .webp({quality:88})
      .toBuffer();
  }catch{
    throw new Error('The selected image could not be safely processed.');
  }
}

type RawBlock={type?:unknown;title?:unknown;productIds?:unknown;imagePath?:unknown};
type RawSection={name?:unknown;blocks?:unknown};

export async function saveStoreCustomization(_:StoreCustomizationResult,form:FormData):Promise<StoreCustomizationResult>{
  if(!configured())return {error:'Store customization is unavailable right now.'};

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)return {error:'Your session has expired. Please sign in again.'};

  let rawSections:RawSection[]=[];
  try{
    const parsed=JSON.parse(String(form.get('sections_json')||'[]')) as unknown;
    if(!Array.isArray(parsed)||parsed.length>3)return {error:'A store can have at most 3 custom sections.'};
    rawSections=parsed as RawSection[];
  }catch{
    return {error:'Unable to read your store sections. Please try again.'};
  }

  const {data:profile,error:profileError}=await client.from('marketplace_profiles')
    .select('banner_path')
    .eq('id',user.id)
    .maybeSingle();
  if(profileError)return {error:'Unable to load your current store.'};

  const currentSections=await client.rpc('marketplace_public_store_sections',{p_seller:user.id});
  const oldSectionImages:string[]=[];
  if(Array.isArray(currentSections.data)){
    for(const section of currentSections.data){
      if(!section||typeof section!=='object')continue;
      const content=(section as Record<string,unknown>).content;
      if(!Array.isArray(content))continue;
      for(const block of content){
        if(block&&typeof block==='object'){
          const path=(block as Record<string,unknown>).image_path;
          if(typeof path==='string'&&path)oldSectionImages.push(path);
        }
      }
    }
  }

  const oldBanner=profile?.banner_path||null;
  let bannerPath=oldBanner;
  let uploadedBanner:string|null=null;
  const uploadedSectionImages:string[]=[];
  const usedNames=new Set<string>();
  const sections:{name:string;content:Record<string,unknown>[]}[]=[];

  try{
    const banner=form.get('banner');
    if(banner instanceof File&&banner.size>0){
      const body=await cleanImage(banner,'banner');
      uploadedBanner=`${user.id}/banner-${crypto.randomUUID()}.webp`;
      const uploaded=await client.storage.from('marketplace-profile-images')
        .upload(uploadedBanner,body,{contentType:'image/webp',upsert:false,cacheControl:'31536000'});
      if(uploaded.error)throw new Error('Unable to upload your shop banner.');
      bannerPath=uploadedBanner;
    }
    if(form.has('remove_banner'))bannerPath=null;

    for(let sectionIndex=0;sectionIndex<rawSections.length;sectionIndex++){
      const rawSection=rawSections[sectionIndex];
      const name=cleanPlainText(String(rawSection.name||''));
      if(name.length<2||name.length>40||containsUnsafeMarkup(name)||containsBlockedContent(name)){
        throw new Error('Section names must be safe and between 2 and 40 characters.');
      }
      const normalized=name.toLocaleLowerCase('en');
      if(normalized==='home'||normalized==='all products'){
        throw new Error('Home and All Products are reserved section names.');
      }
      if(usedNames.has(normalized))throw new Error('Each custom section needs a different name.');
      usedNames.add(normalized);

      const rawBlocks=Array.isArray(rawSection.blocks)?rawSection.blocks as RawBlock[]:[];
      if(rawBlocks.length>12)throw new Error('Each section can contain up to 12 content blocks.');

      const content:Record<string,unknown>[]=[];

      for(let blockIndex=0;blockIndex<rawBlocks.length;blockIndex++){
        const block=rawBlocks[blockIndex];

        if(block.type==='subcategory'){
          const title=cleanPlainText(String(block.title||''));
          if(title.length<1||title.length>60||containsUnsafeMarkup(title)||containsBlockedContent(title)){
            throw new Error('Subcategory names must be safe and 60 characters or fewer.');
          }
          content.push({type:'subcategory',title});
          continue;
        }

        if(block.type==='products'){
          const rawIds=Array.isArray(block.productIds)?block.productIds:[];
          const productIds=[...new Set(rawIds.map(String).filter(value=>uuid.test(value)))];
          content.push({type:'products',product_ids:productIds});
          continue;
        }

        if(block.type==='image'){
          let imagePath=typeof block.imagePath==='string'?block.imagePath:'';
          const file=form.get(`section_image_${sectionIndex}_${blockIndex}`);
          if(file instanceof File&&file.size>0){
            const body=await cleanImage(file,'section');
            imagePath=`${user.id}/store-${crypto.randomUUID()}.webp`;
            const uploaded=await client.storage.from('marketplace-profile-images')
              .upload(imagePath,body,{contentType:'image/webp',upsert:false,cacheControl:'31536000'});
            if(uploaded.error)throw new Error('Unable to upload one of your section images.');
            uploadedSectionImages.push(imagePath);
          }
          if(!imagePath)throw new Error('Choose an image for every image block before saving.');
          content.push({type:'image',image_path:imagePath});
          continue;
        }

        throw new Error('One of the store content blocks is invalid.');
      }

      sections.push({name,content});
    }

    const saved=await client.rpc('marketplace_save_store_customization_v2',{
      p_banner_path:bannerPath,
      p_sections:sections,
    });
    if(saved.error||saved.data!==true)throw new Error(saved.error?.message||'Unable to save your store customization.');

    if(oldBanner&&oldBanner!==bannerPath){
      await client.storage.from('marketplace-profile-images').remove([oldBanner]);
    }

    const keptImages=new Set(
      sections.flatMap(section=>section.content.flatMap(block=>typeof block.image_path==='string'?[block.image_path]:[]))
    );
    const staleImages=oldSectionImages.filter(path=>!keptImages.has(path));
    if(staleImages.length)await client.storage.from('marketplace-profile-images').remove(staleImages);
  }catch(error){
    const cleanup=[uploadedBanner,...uploadedSectionImages].filter((path):path is string=>Boolean(path));
    if(cleanup.length)await client.storage.from('marketplace-profile-images').remove(cleanup);
    return {error:error instanceof Error?error.message:'Unable to save your store customization.'};
  }

  revalidatePath(`/seller/${user.id}`);
  revalidatePath('/my-store');
  return {
    message:'Store customization saved.',
    imagePaths:sections.map(section=>section.content.map(block=>typeof block.image_path==='string'?block.image_path:null)),
  };
}
