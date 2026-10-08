'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { configured, db } from '@/lib/supabase';
import { cleanPlainText, containsBlockedContent, containsUnsafeMarkup } from '@/lib/moderation';

export type AuthResult={error?:string;ok?:boolean;message?:string};
const text=(f:FormData,key:string)=>String(f.get(key)||'');
function safeNext(value:string){return ['/','/submit-product','/my-submissions','/admin','/items','/saved','/profile','/my-store','/promote'].includes(value)||/^\/seller\/[a-f0-9-]{36}$/i.test(value)||/^\/items\/[a-z0-9-]{3,100}$/i.test(value)?value:'/submit-product';}

export async function authenticate(_:AuthResult,f:FormData):Promise<AuthResult>{
  if(!configured())return {error:'Pasar Karat authentication is not configured yet.'};
  const email=text(f,'email').trim();
  const password=text(f,'password');
  const next=safeNext(text(f,'next'));
  if(!email||password.length<8)return {error:'Enter your email and a password of at least 8 characters.'};
  const client=await db();
  const {error}=await client.auth.signInWithPassword({email,password});
  if(error)return {error:'Unable to sign in. Check your email and password.'};
  redirect(next);
}

export async function createAccount(_:AuthResult,f:FormData):Promise<AuthResult>{
  if(!configured())return {error:'Pasar Karat authentication is not configured yet.'};
  const displayName=cleanPlainText(text(f,'display_name'));
  const email=text(f,'email').trim();
  const password=text(f,'password');
  const confirm=text(f,'confirm_password');
  const next=safeNext(text(f,'next'));
  if(displayName.length<2||displayName.length>60||containsUnsafeMarkup(displayName)||containsBlockedContent(displayName))
    return {error:'Use a safe display name between 2 and 60 characters.'};
  if(!email||password.length<8)return {error:'Enter your email and a password of at least 8 characters.'};
  if(password!==confirm)return {error:'Your passwords do not match.'};

  const client=await db();
  const site=process.env.NEXT_PUBLIC_SITE_URL||'http://127.0.0.1:3000';
  const {data,error}=await client.auth.signUp({
    email,password,
    options:{data:{display_name:displayName},emailRedirectTo:`${site}/auth/callback?next=${encodeURIComponent(next)}`},
  });
  if(error)return {error:'Unable to create this account. Try again later.'};
  if(!data.session)return {ok:true,message:'Check your email to confirm your account, then return here to sign in.'};
  redirect(next);
}

export async function requestPasswordReset(_:AuthResult,f:FormData):Promise<AuthResult>{
  if(!configured())return {error:'Pasar Karat authentication is not configured yet.'};
  const email=text(f,'email').trim();
  if(!email)return {error:'Enter your email address.'};
  const client=await db();
  const site=process.env.NEXT_PUBLIC_SITE_URL||'http://127.0.0.1:3000';
  const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:`${site}/auth/callback?next=/auth/reset-password`});
  if(error)return {error:'Unable to send a reset email right now.'};
  return {ok:true,message:'If an account exists for this email, a password reset link has been sent.'};
}

export async function updatePassword(_:AuthResult,f:FormData):Promise<AuthResult>{
  if(!configured())return {error:'Pasar Karat authentication is not configured yet.'};
  const password=text(f,'password');
  const confirm=text(f,'confirm_password');
  if(password.length<8)return {error:'Use a password of at least 8 characters.'};
  if(password!==confirm)return {error:'Your passwords do not match.'};
  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)return {error:'This password reset link is no longer valid.'};
  const {error}=await client.auth.updateUser({password});
  if(error)return {error:'Unable to update your password.'};
  await client.auth.signOut();
  redirect('/auth?password=updated');
}

export async function signOut(){
  if(configured()){
    const client=await db();
    await client.auth.signOut();
  }
  // Clear any prefetched/cached authenticated route tree before redirecting.
  revalidatePath('/','layout');
  redirect('/');
}
