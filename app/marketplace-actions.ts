'use server';

import { configured, db } from '@/lib/supabase';

const validProductKey=/^(?:[0-9]{1,8}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;

export async function getAccountSavedIds():Promise<{signedIn:boolean;ids:string[]}>{
  if(!configured())return {signedIn:false,ids:[]};
  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)return {signedIn:false,ids:[]};

  const result=await client.rpc('marketplace_my_saved_products');
  if(result.error||!Array.isArray(result.data))return {signedIn:true,ids:[]};
  return {signedIn:true,ids:result.data.map(String).filter(id=>validProductKey.test(id))};
}

export async function toggleAccountSavedProduct(productKey:string):Promise<{signedIn:boolean;saved:boolean;error?:string}>{
  if(!configured()||!validProductKey.test(productKey))return {signedIn:false,saved:false,error:'invalid'};
  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)return {signedIn:false,saved:false};

  const result=await client.rpc('marketplace_toggle_save',{p_product_key:productKey});
  if(result.error)return {signedIn:true,saved:false,error:'save'};
  return {signedIn:true,saved:result.data===true};
}


export type CommunityMemoryProfile={
  signedIn:boolean;
  displayName:string;
  avatarUrl:string|null;
};

export async function getCommunityMemoryProfile():Promise<CommunityMemoryProfile>{
  if(!configured())return {signedIn:false,displayName:'',avatarUrl:null};

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)return {signedIn:false,displayName:'',avatarUrl:null};

  const {data}=await client.from('marketplace_profiles')
    .select('display_name,avatar_path')
    .eq('id',user.id)
    .maybeSingle();

  const displayName=typeof data?.display_name==='string'&&data.display_name.trim()
    ? data.display_name.trim()
    : String(user.user_metadata?.display_name||'').trim();

  const avatarUrl=typeof data?.avatar_path==='string'&&data.avatar_path
    ? client.storage.from('marketplace-profile-images').getPublicUrl(data.avatar_path).data.publicUrl
    : null;

  return {signedIn:true,displayName,avatarUrl};
}
