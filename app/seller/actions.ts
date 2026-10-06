'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { configured, db } from '@/lib/supabase';

const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

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
