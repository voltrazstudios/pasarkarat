import { sellerSummary } from '@/lib/sellers';
import { SellerStorePage, type StorePageQuery } from '../store-page';

export const dynamic='force-dynamic';

export async function generateMetadata({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const seller=await sellerSummary(id);
  return {title:seller?`${seller.storeName} — Seller`:'Seller not found'};
}

export default async function SellerPage({
  params,
  searchParams,
}:{
  params:Promise<{id:string}>;
  searchParams:Promise<StorePageQuery>;
}){
  const {id}=await params;
  const query=await searchParams;
  return <SellerStorePage id={id} query={query}/>;
}
