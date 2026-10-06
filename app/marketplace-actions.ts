'use server';

import { configured, db } from '@/lib/supabase';

const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export async function syncSavedProducts(productIds:string[],visitorId:string){
  if(!configured()||!uuid.test(visitorId))return;
  const ids=[...new Set(productIds.filter(id=>uuid.test(id)))].slice(0,200);
  const client=await db();
  await client.rpc('marketplace_sync_saves',{p_product_ids:ids,p_visitor:visitorId});
}
