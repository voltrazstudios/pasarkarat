'use server';

import { configured, db } from '@/lib/supabase';
import { platforms, type Platform } from '@/data/products';

const UUID_RE=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const VISITOR_RE=/^[A-Za-z0-9_-]{8,120}$/;

export async function recordProductView(productId:string,visitorId:string){
  if(!configured()||!UUID_RE.test(productId)||!VISITOR_RE.test(visitorId))return;
  const client=await db();
  await client.rpc('marketplace_record_product_view',{p_product_id:productId,p_visitor_id:visitorId});
}

export async function recordPlatformClick(productId:string,platform:Platform,visitorId:string){
  if(!configured()||!UUID_RE.test(productId)||!platforms.includes(platform)||!VISITOR_RE.test(visitorId))return;
  const client=await db();
  await client.rpc('marketplace_record_platform_click',{p_product_id:productId,p_platform:platform,p_visitor_id:visitorId});
}
