import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/supabase';
function safeNext(value:string){return ['/','/submit-product','/my-submissions','/admin','/items','/saved','/auth/reset-password'].includes(value)||/^\/seller\/[a-f0-9-]{36}$/i.test(value)||/^\/items\/[a-z0-9-]{3,100}$/i.test(value)?value:'/submit-product';}
export async function GET(request:NextRequest){
  const code=request.nextUrl.searchParams.get('code');
  const tokenHash=request.nextUrl.searchParams.get('token_hash');
  const type=request.nextUrl.searchParams.get('type');
  const next=safeNext(request.nextUrl.searchParams.get('next')||'/submit-product');
  const client=await db();
  if(tokenHash&&type==='recovery'){
    const {error}=await client.auth.verifyOtp({token_hash:tokenHash,type:'recovery'});
    if(!error)return NextResponse.redirect(new URL('/auth/reset-password',request.url));
  }
  if(code){
    const {error}=await client.auth.exchangeCodeForSession(code);
    if(!error)return NextResponse.redirect(new URL(next,request.url));
  }
  return NextResponse.redirect(new URL(type==='recovery'?'/auth/forgot-password?error=invalid':'/auth?error=confirmation',request.url));
}
