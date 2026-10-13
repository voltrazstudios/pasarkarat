'use server';

import sharp from 'sharp';
import { redirect } from 'next/navigation';
import { categories, platforms, type Platform } from '@/data/products';
import { cleanPlainText, containsBlockedContent, containsUnsafeMarkup } from '@/lib/moderation';
import { slugifyProductName, validatePlatformUrl } from '@/lib/product-validation';
import { normalizeStoryVideoUrl } from '@/lib/rare-listing';
import { configured, db } from '@/lib/supabase';

export type SubmissionResult={error?:string};

const text=(f:FormData,key:string)=>String(f.get(key)||'');
const MAX_IMAGE_BYTES=5*1024*1024;
const MAX_STORY_IMAGES=6;

function isPlatform(value:string):value is Platform{
  return platforms.includes(value as Platform);
}

async function cleanProductImage(image:File){
  if(image.size>MAX_IMAGE_BYTES)throw new Error('Each image must be 5 MB or smaller.');

  const extension=image.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]||'';
  if(!['png','jpg','jpeg','webp'].includes(extension))throw new Error('Use PNG, JPG, JPEG or WebP images.');

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

export async function submitProduct(_:SubmissionResult,f:FormData):Promise<SubmissionResult>{
  if(!configured())return {error:'Product submissions are not configured yet.'};

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth?next=/submit-product');
  const userId=user.id;

  const name=cleanPlainText(text(f,'name'));
  const description=cleanPlainText(text(f,'description'));
  const category=text(f,'category');
  const listingType=text(f,'listing_type')==='rare_limited'?'rare_limited':'normal';
  const rawMinPrice=text(f,'min_price').trim();
  const rawMaxPrice=text(f,'max_price').trim();

  if(name.length<2||name.length>100)return {error:'Product name must be between 2 and 100 characters.'};
  if(description.length<10||description.length>2000)return {error:'Description must be between 10 and 2,000 characters.'};
  if(containsUnsafeMarkup(name)||containsUnsafeMarkup(description)||containsBlockedContent(name)||containsBlockedContent(description))
    return {error:'Please remove unsafe markup or harmful technical content before submitting.'};
  if(!categories.includes(category as (typeof categories)[number]))return {error:'Choose a valid category.'};

  const pricePattern=/^\d{1,10}(?:\.\d{1,2})?$/;
  if(!pricePattern.test(rawMinPrice)||!pricePattern.test(rawMaxPrice))
    return {error:'Enter valid minimum and maximum prices with up to two decimal places.'};

  const minPrice=Number(rawMinPrice);
  const maxPrice=Number(rawMaxPrice);

  if(!Number.isFinite(minPrice)||minPrice<=0||minPrice>9999999999.99)return {error:'Enter a valid minimum price.'};
  if(!Number.isFinite(maxPrice)||maxPrice<=0||maxPrice>9999999999.99)return {error:'Enter a valid maximum price.'};
  if(maxPrice<minPrice)return {error:'Maximum price must be the same as or higher than minimum price.'};

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

  const mainImage=f.get('image');
  if(!(mainImage instanceof File)||mainImage.size===0)return {error:'Choose a product image.'};

  let storyTitle:string|null=null;
  let storyText:string|null=null;
  let storyVideoUrl:string|null=null;
  let certificateTitle:string|null=null;
  let certificateDetails:string|null=null;
  let auctionEnabled=false;
  let auctionStartingBid:number|null=null;
  let auctionMinIncrement:number|null=null;
  let auctionDurationMinutes:number|null=null;

  const storyFiles=f.getAll('story_images').filter((value):value is File=>value instanceof File&&value.size>0);
  const certificateImage=f.get('certificate_image');
  const hasCertificateImage=certificateImage instanceof File&&certificateImage.size>0;

  if(storyFiles.length>MAX_STORY_IMAGES)return {error:'Rare & Limited stories can include up to 6 images.'};

  if(listingType==='rare_limited'){
    storyTitle=cleanPlainText(text(f,'story_title'));
    storyText=cleanPlainText(text(f,'story_text'));
    const rawStoryVideo=text(f,'story_video_url').trim();
    certificateTitle=cleanPlainText(text(f,'certificate_title'))||null;
    certificateDetails=cleanPlainText(text(f,'certificate_details'))||null;

    if(storyTitle.length<3||storyTitle.length>120)return {error:'Story title must be between 3 and 120 characters.'};
    if(storyText.length<100||storyText.length>12000)return {error:'Story must be between 100 and 12,000 characters.'};
    if(containsUnsafeMarkup(storyTitle)||containsUnsafeMarkup(storyText)||containsBlockedContent(storyTitle)||containsBlockedContent(storyText))
      return {error:'Please remove unsafe markup or harmful technical content from the story.'};

    if(rawStoryVideo){
      storyVideoUrl=normalizeStoryVideoUrl(rawStoryVideo);
      if(!storyVideoUrl)return {error:'Story video must be a valid HTTPS YouTube or Vimeo link.'};
    }

    if(certificateTitle&&certificateTitle.length>120)return {error:'Certificate title must be 120 characters or fewer.'};
    if(certificateDetails&&certificateDetails.length>3000)return {error:'Certificate details must be 3,000 characters or fewer.'};
    if((certificateTitle&&containsUnsafeMarkup(certificateTitle))||(certificateDetails&&containsUnsafeMarkup(certificateDetails)))
      return {error:'Please remove unsafe markup from certificate details.'};

    auctionEnabled=f.get('auction_enabled')==='on';

    if(auctionEnabled){
      const rawStart=text(f,'auction_starting_bid').trim();
      const rawIncrement=text(f,'auction_min_increment').trim();
      const rawHours=text(f,'auction_duration_hours').trim();

      if(!pricePattern.test(rawStart)||!pricePattern.test(rawIncrement))
        return {error:'Enter valid auction amounts with up to two decimal places.'};

      auctionStartingBid=Number(rawStart);
      auctionMinIncrement=Number(rawIncrement);
      const durationHours=Number(rawHours);

      if(!Number.isFinite(auctionStartingBid)||auctionStartingBid<=0||auctionStartingBid>9999999999.99)
        return {error:'Enter a valid auction starting bid.'};
      if(!Number.isFinite(auctionMinIncrement)||auctionMinIncrement<=0||auctionMinIncrement>9999999999.99)
        return {error:'Enter a valid minimum bid increase.'};
      if(!Number.isInteger(durationHours)||durationHours<1||durationHours>168)
        return {error:'Auction duration must be between 1 hour and 7 days.'};

      auctionDurationMinutes=durationHours*60;
    }
  }

  const uploadedPaths:string[]=[];

  async function uploadPrivateImage(file:File){
    const cleaned=await cleanProductImage(file);
    const path=`${userId}/${crypto.randomUUID()}.webp`;
    const upload=await client.storage.from('product-submission-images')
      .upload(path,cleaned,{contentType:'image/webp',upsert:false,cacheControl:'3600'});
    if(upload.error)throw new Error('Unable to upload one of the images.');
    uploadedPaths.push(path);
    return path;
  }

  let imagePath:string;
  let storyImagePaths:string[]=[];
  let certificateImagePath:string|null=null;

  try{
    imagePath=await uploadPrivateImage(mainImage);

    if(listingType==='rare_limited'){
      storyImagePaths=[];
      for(const file of storyFiles){
        storyImagePaths.push(await uploadPrivateImage(file));
      }

      if(hasCertificateImage){
        certificateImagePath=await uploadPrivateImage(certificateImage as File);
      }
    }
  }catch(error){
    if(uploadedPaths.length)await client.storage.from('product-submission-images').remove(uploadedPaths);
    return {error:error instanceof Error?error.message:'The images could not be safely processed.'};
  }

  const slug=`${slugifyProductName(name)}-${crypto.randomUUID().slice(0,8)}`;
  const submitted=await client.rpc('submit_marketplace_product_rich',{
    p_slug:slug,
    p_name:name,
    p_description:description,
    p_min_price:minPrice,
    p_max_price:maxPrice,
    p_category:category,
    p_image_path:imagePath,
    p_links:links,
    p_listing_type:listingType,
    p_story_title:storyTitle,
    p_story_text:storyText,
    p_story_image_paths:storyImagePaths,
    p_story_video_url:storyVideoUrl,
    p_certificate_title:certificateTitle,
    p_certificate_details:certificateDetails,
    p_certificate_image_path:certificateImagePath,
    p_auction_enabled:auctionEnabled,
    p_auction_starting_bid:auctionStartingBid,
    p_auction_min_increment:auctionMinIncrement,
    p_auction_duration_minutes:auctionDurationMinutes,
  });

  if(submitted.error){
    if(uploadedPaths.length)await client.storage.from('product-submission-images').remove(uploadedPaths);
    return {error:'Unable to submit this product. Please check the details and try again.'};
  }

  redirect('/my-submissions?submitted=1');
}
