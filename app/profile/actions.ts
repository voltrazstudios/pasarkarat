'use server';

import { revalidatePath } from 'next/cache';
import { configured, db } from '@/lib/supabase';
import { cleanPlainText, containsBlockedContent, containsUnsafeMarkup } from '@/lib/moderation';

export type ProfileResult={error?:string;message?:string};

const text=(form:FormData,key:string)=>String(form.get(key)||'');

export async function updateProfile(_:ProfileResult,form:FormData):Promise<ProfileResult>{
  if(!configured())return {error:'Profile editing is not configured yet.'};

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)return {error:'Your session has expired. Please sign in again.'};

  const displayName=cleanPlainText(text(form,'display_name'));
  const description=cleanPlainText(text(form,'description'));

  if(displayName.length<2||displayName.length>60||containsUnsafeMarkup(displayName)||containsBlockedContent(displayName)){
    return {error:'Use a safe name between 2 and 60 characters.'};
  }
  if(description.length>300||containsUnsafeMarkup(description)||containsBlockedContent(description)){
    return {error:'Use a safe description of up to 300 characters.'};
  }

  const saved=await client.from('marketplace_profiles').upsert({
    id:user.id,
    display_name:displayName,
    description:description||null,
    updated_at:new Date().toISOString(),
  },{onConflict:'id'});

  if(saved.error)return {error:'Unable to save your profile right now.'};

  // Keep the auth display name aligned with the marketplace profile.
  await client.auth.updateUser({data:{display_name:displayName}});

  revalidatePath('/profile');
  revalidatePath(`/seller/${user.id}`);
  revalidatePath('/items');
  revalidatePath('/my-submissions');
  return {message:'Profile saved.'};
}
