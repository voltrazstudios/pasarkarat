'use server';

import sharp from 'sharp';
import { revalidatePath } from 'next/cache';
import { configured, db } from '@/lib/supabase';
import { cleanPlainText, containsBlockedContent, containsUnsafeMarkup } from '@/lib/moderation';

export type ProfileResult={error?:string;message?:string};

const text=(form:FormData,key:string)=>String(form.get(key)||'');
const MAX_AVATAR_BYTES=2*1024*1024;
const MAX_BANNER_BYTES=5*1024*1024;
const IMAGE_TYPES=new Set(['image/png','image/jpeg','image/webp']);
const GENDERS=new Set(['','Male','Female','Other','Prefer not to say']);

async function cleanImage(file:File,kind:'avatar'|'banner'){
  const maxBytes=kind==='avatar'?MAX_AVATAR_BYTES:MAX_BANNER_BYTES;
  if(file.size>maxBytes)throw new Error(kind==='avatar'?'Profile picture must be 2 MB or smaller.':'Shop banner must be 5 MB or smaller.');
  if(!IMAGE_TYPES.has(file.type))throw new Error('Use a PNG, JPG, or WebP image.');

  const input=Buffer.from(await file.arrayBuffer());
  try{
    const base=sharp(input,{failOn:'error',limitInputPixels:40000000}).rotate();
    const metadata=await base.metadata();
    if(!metadata.width||!metadata.height||metadata.width>10000||metadata.height>10000)throw new Error('bad dimensions');

    if(kind==='avatar'){
      return await sharp(input,{failOn:'error',limitInputPixels:40000000})
        .rotate()
        .resize(512,512,{fit:'cover',position:'centre',withoutEnlargement:false})
        .webp({quality:88})
        .toBuffer();
    }

    return await sharp(input,{failOn:'error',limitInputPixels:40000000})
      .rotate()
      .resize(1800,600,{fit:'cover',position:'centre',withoutEnlargement:false})
      .webp({quality:88})
      .toBuffer();
  }catch{
    throw new Error('The selected image could not be safely processed.');
  }
}

export async function updateProfile(_:ProfileResult,form:FormData):Promise<ProfileResult>{
  if(!configured())return {error:'Profile editing is not configured yet.'};

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)return {error:'Your session has expired. Please sign in again.'};

  const username=cleanPlainText(text(form,'display_name'));
  const description=cleanPlainText(text(form,'description'));
  const fullName=cleanPlainText(text(form,'full_name'));
  const phone=cleanPlainText(text(form,'phone'));
  const gender=text(form,'gender').trim();
  const dateOfBirth=text(form,'date_of_birth').trim();

  if(username.length<2||username.length>60||containsUnsafeMarkup(username)||containsBlockedContent(username)){
    return {error:'Use a safe username between 2 and 60 characters.'};
  }
  if(description.length>300||containsUnsafeMarkup(description)||containsBlockedContent(description)){
    return {error:'Use a safe shop description of up to 300 characters.'};
  }
  if(fullName.length>100||containsUnsafeMarkup(fullName)||containsBlockedContent(fullName)){
    return {error:'Name must be 100 characters or fewer.'};
  }
  if(phone.length>25||phone&&!/^[+0-9() .-]{5,25}$/.test(phone)){
    return {error:'Enter a valid phone number or leave it blank.'};
  }
  if(!GENDERS.has(gender))return {error:'Choose a valid gender option.'};

  if(dateOfBirth){
    const birth=new Date(`${dateOfBirth}T00:00:00Z`);
    const now=new Date();
    if(Number.isNaN(birth.getTime())||birth>now||birth.getUTCFullYear()<1900){
      return {error:'Enter a valid date of birth.'};
    }
  }

  const {data:currentProfile,error:profileError}=await client.from('marketplace_profiles')
    .select('avatar_path,banner_path')
    .eq('id',user.id)
    .maybeSingle();
  if(profileError)return {error:'Unable to load your current profile.'};

  const oldAvatar=currentProfile?.avatar_path||null;
  const oldBanner=currentProfile?.banner_path||null;
  let avatarPath=oldAvatar;
  let bannerPath=oldBanner;
  const uploaded:string[]=[];

  try{
    const avatar=form.get('avatar');
    if(avatar instanceof File&&avatar.size>0){
      const body=await cleanImage(avatar,'avatar');
      avatarPath=`${user.id}/avatar-${crypto.randomUUID()}.webp`;
      const upload=await client.storage.from('marketplace-profile-images')
        .upload(avatarPath,body,{contentType:'image/webp',upsert:false,cacheControl:'31536000'});
      if(upload.error)throw new Error('Unable to upload your profile picture.');
      uploaded.push(avatarPath);
    }

    const banner=form.get('banner');
    if(banner instanceof File&&banner.size>0){
      const body=await cleanImage(banner,'banner');
      bannerPath=`${user.id}/banner-${crypto.randomUUID()}.webp`;
      const upload=await client.storage.from('marketplace-profile-images')
        .upload(bannerPath,body,{contentType:'image/webp',upsert:false,cacheControl:'31536000'});
      if(upload.error)throw new Error('Unable to upload your shop banner.');
      uploaded.push(bannerPath);
    }

    if(form.has('remove_avatar'))avatarPath=null;
    if(form.has('remove_banner'))bannerPath=null;

    const saved=await client.from('marketplace_profiles').upsert({
      id:user.id,
      display_name:username,
      description:description||null,
      full_name:fullName||null,
      phone:phone||null,
      gender:gender||null,
      date_of_birth:dateOfBirth||null,
      avatar_path:avatarPath,
      banner_path:bannerPath,
      updated_at:new Date().toISOString(),
    },{onConflict:'id'});

    if(saved.error)throw new Error('Unable to save your profile right now.');

    await client.auth.updateUser({data:{display_name:username}});

    const stale=[oldAvatar,oldBanner].filter((path):path is string=>Boolean(path&&path!==avatarPath&&path!==bannerPath));
    if(stale.length)await client.storage.from('marketplace-profile-images').remove(stale);
    const unused=uploaded.filter(path=>path!==avatarPath&&path!==bannerPath);
    if(unused.length)await client.storage.from('marketplace-profile-images').remove(unused);
  }catch(error){
    if(uploaded.length)await client.storage.from('marketplace-profile-images').remove(uploaded);
    return {error:error instanceof Error?error.message:'Unable to save your profile right now.'};
  }

  revalidatePath('/','layout');
  revalidatePath('/profile');
  revalidatePath(`/seller/${user.id}`);
  revalidatePath('/items');
  revalidatePath('/my-submissions');
  return {message:'Profile saved.'};
}
