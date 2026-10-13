'use server';

import { revalidatePath } from 'next/cache';
import { configured, db } from '@/lib/supabase';

const UUID_RE=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export async function deleteOwnProduct(productId:string):Promise<{ok:boolean;error?:string}>{
  if(!configured()||!UUID_RE.test(productId))return {ok:false,error:'Invalid product.'};

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)return {ok:false,error:'Your session has expired. Please sign in again.'};

  const deleted=await client.rpc('marketplace_owner_delete_product',{p_id:productId});
  if(deleted.error)return {ok:false,error:deleted.error.message.includes('auction bids')?'Products with auction bids cannot be deleted.':'Unable to delete this product right now.'};

  const result=deleted.data as {
    public_image_path?:string|null;
    pending_image_path?:string|null;
    edit_image_paths?:unknown;
    public_story_image_paths?:unknown;
    pending_story_image_paths?:unknown;
    public_certificate_image_path?:string|null;
    pending_certificate_image_path?:string|null;
  }|null;

  const publicPaths=[
    result?.public_image_path,
    ...(Array.isArray(result?.public_story_image_paths)?result!.public_story_image_paths:[]),
    result?.public_certificate_image_path,
  ].filter((value):value is string=>typeof value==='string'&&Boolean(value));

  if(publicPaths.length){
    await client.storage.from('product-images').remove([...new Set(publicPaths)]);
  }

  const privatePaths=[
    result?.pending_image_path,
    ...(Array.isArray(result?.edit_image_paths)?result!.edit_image_paths:[]),
    ...(Array.isArray(result?.pending_story_image_paths)?result!.pending_story_image_paths:[]),
    result?.pending_certificate_image_path,
  ].filter((value):value is string=>typeof value==='string'&&Boolean(value));

  if(privatePaths.length){
    await client.storage.from('product-submission-images').remove([...new Set(privatePaths)]);
  }

  revalidatePath('/my-submissions');
  revalidatePath('/items');
  revalidatePath('/saved');
  revalidatePath('/');
  return {ok:true};
}
