'use server';

import sharp from 'sharp';
import { redirect } from 'next/navigation';
import { categories, platforms, type Platform } from '@/data/products';
import { cleanPlainText, containsBlockedContent, containsUnsafeMarkup } from '@/lib/moderation';
import { validatePlatformUrl } from '@/lib/product-validation';
import { configured, db } from '@/lib/supabase';

export type EditResult={error?:string};

const UUID_RE=/^[a-f0-9-]{36}$/i;
const MAX_IMAGE_BYTES=5*1024*1024;
const text=(form:FormData,key:string)=>String(form.get(key)||'');
function isPlatform(value:string):value is Platform{return platforms.includes(value as Platform);}

async function cleanProductImage(image:File):Promise<Buffer>{
  if(image.size>MAX_IMAGE_BYTES)throw new Error('Product image must be 5 MB or smaller.');
  const extension=image.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]||'';
  if(!['png','jpg','jpeg','webp'].includes(extension))throw new Error('Use a PNG, JPG, JPEG or WebP image.');

  const input=Buffer.from(await image.arrayBuffer());
  const metadata=await sharp(input,{failOn:'error',limitInputPixels:40000000}).metadata();
  const detected=metadata.format;
  if(!metadata.width||!metadata.height||metadata.width>10000||metadata.height>10000)throw new Error('Invalid image dimensions.');
  if(!['png','jpeg','webp'].includes(detected||''))throw new Error('The uploaded file is not a supported image.');

  const mimeForFormat:Record<string,string>={png:'image/png',jpeg:'image/jpeg',webp:'image/webp'};
  if(image.type!==mimeForFormat[detected!])throw new Error('The image file type does not match its contents.');
  if((detected==='jpeg'&&!['jpg','jpeg'].includes(extension))||(detected!=='jpeg'&&extension!==detected))
    throw new Error('The image extension does not match its contents.');

  return sharp(input,{failOn:'error',limitInputPixels:40000000})
    .rotate()
    .resize({width:1800,height:1800,fit:'inside',withoutEnlargement:true})
    .webp({quality:88})
    .toBuffer();
}

export async function submitProductEdit(_:EditResult,form:FormData):Promise<EditResult>{
  if(!configured())return {error:'Product editing is not configured yet.'};

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  const productId=text(form,'product_id');
  if(!user)redirect(`/auth?next=${encodeURIComponent(`/edit-product/${productId}`)}`);
  if(!UUID_RE.test(productId))return {error:'Invalid product.'};

  const name=cleanPlainText(text(form,'name'));
  const description=cleanPlainText(text(form,'description'));
  const category=text(form,'category');
  const rawMinPrice=text(form,'min_price').trim();
  const rawMaxPrice=text(form,'max_price').trim();

  if(name.length<2||name.length>100)return {error:'Product name must be between 2 and 100 characters.'};
  if(description.length<10||description.length>2000)return {error:'Description must be between 10 and 2,000 characters.'};
  if(containsUnsafeMarkup(name)||containsUnsafeMarkup(description)||containsBlockedContent(name)||containsBlockedContent(description))
    return {error:'Please remove unsafe markup or harmful technical content before submitting.'};
  if(!categories.includes(category as (typeof categories)[number]))return {error:'Choose a valid category.'};

  const pricePattern=/^\d{1,10}(?:\.\d{1,2})?$/;
  if(!pricePattern.test(rawMinPrice)||!pricePattern.test(rawMaxPrice))return {error:'Enter valid minimum and maximum prices with up to two decimal places.'};
  const minPrice=Number(rawMinPrice);
  const maxPrice=Number(rawMaxPrice);
  if(!Number.isFinite(minPrice)||minPrice<=0||minPrice>9999999999.99)return {error:'Enter a valid minimum price.'};
  if(!Number.isFinite(maxPrice)||maxPrice<=0||maxPrice>9999999999.99)return {error:'Enter a valid maximum price.'};
  if(maxPrice<minPrice)return {error:'Maximum price must be the same as or higher than minimum price.'};

  const selected=[...new Set(form.getAll('platform').map(String).filter(isPlatform))];
  if(selected.length<1||selected.length>platforms.length)return {error:'Choose at least one selling platform.'};

  const links=[];
  for(const selectedPlatform of selected){
    const seller=validatePlatformUrl(selectedPlatform,text(form,`seller_${selectedPlatform}`));
    const affiliateRaw=text(form,`affiliate_${selectedPlatform}`).trim();
    const affiliate=affiliateRaw?validatePlatformUrl(selectedPlatform,affiliateRaw):null;
    if(!seller)return {error:`Enter a valid HTTPS ${selectedPlatform} seller/product URL.`};
    if(affiliateRaw&&!affiliate)return {error:`Enter a valid HTTPS ${selectedPlatform} affiliate URL or leave it blank.`};
    links.push({platform:selectedPlatform,seller_url:seller,affiliate_url:affiliate});
  }

  let imagePath:string|null=null;
  const image=form.get('image');
  if(image instanceof File&&image.size>0){
    try{
      const cleanImage=await cleanProductImage(image);
      imagePath=`${user.id}/${crypto.randomUUID()}.webp`;
      const upload=await client.storage.from('product-submission-images')
        .upload(imagePath,cleanImage,{contentType:'image/webp',upsert:false,cacheControl:'3600'});
      if(upload.error)return {error:'Unable to upload the replacement image.'};
    }catch(error){
      return {error:error instanceof Error?error.message:'The image could not be safely processed.'};
    }
  }

  const submitted=await client.rpc('submit_marketplace_product_edit',{
    p_product_id:productId,
    p_name:name,
    p_description:description,
    p_min_price:minPrice,
    p_max_price:maxPrice,
    p_category:category,
    p_image_path:imagePath,
    p_links:links,
  });

  if(submitted.error){
    if(imagePath)await client.storage.from('product-submission-images').remove([imagePath]);
    const message=submitted.error.message.includes('already waiting')
      ? 'An edit is already waiting for review.'
      : 'Unable to submit this edit. Please check the details and try again.';
    return {error:message};
  }

  redirect('/my-submissions?edit=submitted');
}
