'use server';

import sharp from 'sharp';
import { redirect } from 'next/navigation';
import { categories, platforms, type Platform } from '@/data/products';
import { cleanPlainText, containsBlockedContent, containsUnsafeMarkup } from '@/lib/moderation';
import { slugifyProductName, validatePlatformUrl } from '@/lib/product-validation';
import { configured, db } from '@/lib/supabase';

export type SubmissionResult={error?:string};
const text=(f:FormData,key:string)=>String(f.get(key)||'');
const MAX_IMAGE_BYTES=5*1024*1024;
function isPlatform(value:string):value is Platform{return platforms.includes(value as Platform);}

export async function submitProduct(_:SubmissionResult,f:FormData):Promise<SubmissionResult>{
  if(!configured())return {error:'Product submissions are not configured yet.'};
  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth?next=/submit-product');

  const name=cleanPlainText(text(f,'name'));
  const description=cleanPlainText(text(f,'description'));
  const category=text(f,'category');
  const rawPrice=text(f,'price').trim();

  if(name.length<2||name.length>100)return {error:'Product name must be between 2 and 100 characters.'};
  if(description.length<10||description.length>2000)return {error:'Description must be between 10 and 2,000 characters.'};
  if(containsUnsafeMarkup(name)||containsUnsafeMarkup(description)||containsBlockedContent(name)||containsBlockedContent(description))
    return {error:'Please remove unsafe markup or harmful technical content before submitting.'};
  if(!categories.includes(category as (typeof categories)[number]))return {error:'Choose a valid category.'};
  if(!/^\d{1,10}(?:\.\d{1,2})?$/.test(rawPrice))return {error:'Enter a valid price with up to two decimal places.'};
  const price=Number(rawPrice);
  if(!Number.isFinite(price)||price<=0||price>9999999999.99)return {error:'Enter a valid product price.'};

  const selected=[...new Set(f.getAll('platform').map(String).filter(isPlatform))];
  if(selected.length<1||selected.length>platforms.length)return {error:'Choose at least one selling platform.'};
  const links=[];
  for(const selectedPlatform of selected){
    const seller=validatePlatformUrl(selectedPlatform,text(f,`seller_${selectedPlatform}`));
    const affiliateRaw=text(f,`affiliate_${selectedPlatform}`).trim();
    const affiliate=affiliateRaw?validatePlatformUrl(selectedPlatform,affiliateRaw):null;
    if(!seller)return {error:`Enter a valid HTTPS ${selectedPlatform} seller/product URL.`};
    if(affiliateRaw&&!affiliate)return {error:`Enter a valid HTTPS ${selectedPlatform} affiliate URL or leave it blank.`};
    links.push({platform:selectedPlatform,seller_url:seller,affiliate_url:affiliate});
  }

  const image=f.get('image');
  if(!(image instanceof File)||image.size===0)return {error:'Choose a product image.'};
  if(image.size>MAX_IMAGE_BYTES)return {error:'Product image must be 5 MB or smaller.'};
  const extension=image.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]||'';
  if(!['png','jpg','jpeg','webp'].includes(extension))return {error:'Use a PNG, JPG, JPEG or WebP image.'};

  let cleanImage:Buffer;
  try{
    const input=Buffer.from(await image.arrayBuffer());
    const metadata=await sharp(input,{failOn:'error',limitInputPixels:40000000}).metadata();
    const detected=metadata.format;
    if(!metadata.width||!metadata.height||metadata.width>10000||metadata.height>10000)throw new Error('Invalid dimensions');
    if(!['png','jpeg','webp'].includes(detected||''))return {error:'The uploaded file is not a supported image.'};
    const mimeForFormat:Record<string,string>={png:'image/png',jpeg:'image/jpeg',webp:'image/webp'};
    if(image.type!==mimeForFormat[detected!])return {error:'The image file type does not match its contents.'};
    if((detected==='jpeg'&&!['jpg','jpeg'].includes(extension))||(detected!=='jpeg'&&extension!==detected))
      return {error:'The image extension does not match its contents.'};
    cleanImage=await sharp(input,{failOn:'error',limitInputPixels:40000000}).rotate().resize({width:1800,height:1800,fit:'inside',withoutEnlargement:true}).webp({quality:88}).toBuffer();
  }catch{
    return {error:'The image could not be safely decoded. Please choose another PNG, JPG or WebP image.'};
  }

  const imagePath=`${user.id}/${crypto.randomUUID()}.webp`;
  const upload=await client.storage.from('product-submission-images').upload(imagePath,cleanImage,{contentType:'image/webp',upsert:false,cacheControl:'3600'});
  if(upload.error)return {error:'Unable to upload the product image.'};

  const slug=`${slugifyProductName(name)}-${crypto.randomUUID().slice(0,8)}`;
  const submitted=await client.rpc('submit_marketplace_product',{p_slug:slug,p_name:name,p_description:description,p_price:price,p_category:category,p_image_path:imagePath,p_links:links});
  if(submitted.error){
    await client.storage.from('product-submission-images').remove([imagePath]);
    return {error:'Unable to submit this product. Please check the details and try again.'};
  }
  redirect('/my-submissions?submitted=1');
}
