import { notFound } from 'next/navigation';
import { sellerIdBySlug, sellerSummary } from '@/lib/sellers';
import { SellerStorePage, type StorePageQuery } from '../../seller/store-page';

export const dynamic='force-dynamic';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const id=await sellerIdBySlug(slug);
  if(!id)return {title:'Store not found'};
  const seller=await sellerSummary(id);
  return {title:seller?`${seller.storeName} — Store`:'Store not found'};
}

export default async function CustomStorePage({
  params,
  searchParams,
}:{
  params:Promise<{slug:string}>;
  searchParams:Promise<StorePageQuery>;
}){
  const {slug}=await params;
  const id=await sellerIdBySlug(slug);
  if(!id)notFound();
  const query=await searchParams;
  return <SellerStorePage id={id} query={{...query,customize:undefined}}/>;
}
