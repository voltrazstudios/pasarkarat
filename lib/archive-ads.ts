import type { Product } from '@/data/products';
import { collectionProducts } from '@/lib/products';
import { configured, db } from '@/lib/supabase';

export type ActiveArchiveAd={
  id:string;
  product:Product;
  weight:number;
};

type Row={id:string;product_id:string;weight:number|string};

export async function activeArchiveAds(archiveSlug:string):Promise<ActiveArchiveAd[]>{
  if(!configured())return [];
  const client=await db();
  const [result,items]=await Promise.all([
    client.rpc('marketplace_active_archive_ads',{p_archive_slug:archiveSlug}),
    collectionProducts(),
  ]);
  if(result.error||!Array.isArray(result.data))return [];

  const products=new Map(items.filter(item=>item.submitted).map(item=>[item.id,item]));
  return (result.data as Row[]).flatMap(row=>{
    const product=products.get(row.product_id);
    if(!product)return [];
    return [{id:row.id,product,weight:Math.max(1,Number(row.weight)||1)}];
  });
}
