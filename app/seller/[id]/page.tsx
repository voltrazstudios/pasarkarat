import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SellerProfileCard } from '@/components/seller-profile-card';
import { collectionProducts } from '@/lib/products';
import { sellerProductMetrics, sellerSections, sellerSummary } from '@/lib/sellers';
import { setSellerFollow } from '../actions';
import { StoreCustomizer } from '../store-customizer';
import { StoreProductsView } from '../store-products-view';
import { StoreBanner } from '@/components/store-banner';

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
  const heading=active==='all'?'All Products':active==='home'?'Home':active;

  const followAction=seller.isOwner?null:
    <form action={setSellerFollow}>
      <input type="hidden" name="seller_id" value={seller.id}/>
      <input type="hidden" name="follow" value={seller.isFollowing?'false':'true'}/>
      <button className={seller.isFollowing?'button secondary seller-follow-button':'button seller-follow-button'} type="submit">{seller.isFollowing?'Following':'Follow'}</button>
    </form>;

  return <main id="main" className="container seller-page">
    {query.error?<div className="form-notice error" role="alert">{query.error==='follow'?'Unable to update your follow right now. Please try again.':'Seller features are unavailable right now.'}</div>:null}

    <StoreBanner src={seller.bannerUrl||''}/>

    <SellerProfileCard seller={seller} actions={followAction}/>

    <nav className="seller-store-nav" aria-label="Store sections" data-preview={customizing?'true':'false'}>
      {customizing?<>
        <span className={active==='home'?'active':''} aria-disabled="true">Home</span>
        <span className={active==='all'?'active':''} aria-disabled="true">All Products</span>
        {sections.map(section=><span
          className={active===section.name?'active':''}
          aria-disabled="true"
          key={section.name}
        >{section.name}</span>)}
      </>:<>
        <Link className={active==='home'?'active':''} href={`/seller/${seller.id}`}>Home</Link>
        <Link className={active==='all'?'active':''} href={{pathname:`/seller/${seller.id}`,query:{section:'all'}}}>All Products</Link>
        {sections.map(section=><Link
          className={active===section.name?'active':''}
          href={{pathname:`/seller/${seller.id}`,query:{section:section.name}}}
          key={section.name}
        >{section.name}</Link>)}
      </>}
    </nav>

    {seller.isOwner?<StoreCustomizer
      bannerUrl={seller.bannerUrl||''}
      initialSections={sections}
      products={products.map(product=>({id:product.id,name:product.name}))}
      initialOpen={customizing}
      sellerId={seller.id}
    />:null}

    {!customizing?<section className="seller-products-section">
      <div className="section-heading seller-store-content-heading"><h1>{heading}</h1></div>
      <StoreProductsView
        products={products}
        metrics={metrics}
        section={customSection}
        homeLimit={active==='home'?4:undefined}
      />
    </section>:null}
  </main>;
}
