import { notFound } from 'next/navigation';
import { configured, db } from './supabase';

export async function adminClient(){
  if(!configured())return null;
  const client=await db();
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user)return null;
  const check=await client.rpc('is_marketplace_admin');
  return !check.error&&check.data===true?client:null;
}
export async function requireAdmin(){
  const client=await adminClient();
  if(!client)notFound();
  return client;
}
