import { notFound } from 'next/navigation';
import { collectionProducts } from '@/lib/products';
import { sellerProductMetrics, sellerSections, sellerSummary } from '@/lib/sellers';
import { StoreBanner } from '@/components/store-banner';
import { SellerStorefrontShell } from '../storefront-shell';

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
  searchParams:Promise<{error?:string;section?:string;customize?:string}>;
}){
  const {id}=await params;
  const [seller,allProducts,sections,metrics,query]=await Promise.all([
    sellerSummary(id),
    collectionProducts(),
    sellerSections(id),
    sellerProductMetrics(id),
    searchParams,
  ]);
  if(!seller)notFound();

  const products=allProducts.filter(product=>product.sellerId===seller.id);
  const requested=query.section||'home';
  const customSection=sections.find(section=>section.name===requested)||null;
  const active=requested==='all'?'all':customSection?customSection.name:'home';
  const customizing=seller.isOwner&&query.customize==='1';

  return <main id="main" className="container seller-page">
    {query.error?<div className="form-notice error" role="alert">{query.error==='follow'?'Unable to update your follow right now. Please try again.':'Seller features are unavailable right now.'}</div>:null}

    <StoreBanner src={seller.bannerUrl||''}/>

    <SellerStorefrontShell
      seller={seller}
      sections={sections}
      products={products}
      metrics={metrics}
      initialActive={active}
      customizing={customizing}
    />
  </main>;
}
