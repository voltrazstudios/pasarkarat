import { redirect } from 'next/navigation';
import { configured, db } from '@/lib/supabase';

export const dynamic='force-dynamic';

export default async function MyStorePage(){
  if(!configured())redirect('/auth?next=/my-store');
  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth?next=/my-store');
  redirect(`/seller/${user.id}`);
}
