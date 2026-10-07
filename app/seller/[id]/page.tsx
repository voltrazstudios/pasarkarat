import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SellerProfileCard } from '@/components/seller-profile-card';
import { ProductCard } from '@/components/marketplace';
import { collectionProducts } from '@/lib/products';
import { sellerSections, sellerSummary } from '@/lib/sellers';
import { setSellerFollow } from '../actions';
import { StoreCustomizer } from '../store-customizer';

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
  searchParams:Promise<{error?:string;section?:string}>;
}){
  const {id}=await params;
  const [seller,allProducts,sections,query]=await Promise.all([
    sellerSummary(id),
    collectionProducts(),
    sellerSections(id),
    searchParams,
  ]);
  if(!seller)notFound();

  const products=allProducts.filter(product=>product.sellerId===seller.id);
  const requested=query.section||'home';
  const customSection=sections.find(section=>section.name===requested)||null;
  const active=requested==='all'?'all':customSection?customSection.name:'home';

  const visibleProducts=active==='all'
    ? products
    : active==='home'
      ? products.slice(0,4)
      : products.filter(product=>customSection?.productIds.includes(product.id));

  const heading=active==='all'
    ? 'All Products'
    : active==='home'
      ? 'Featured from this store'
      : active;

  const followAction=seller.isOwner?null:
    <form action={setSellerFollow}>
      <input type="hidden" name="seller_id" value={seller.id}/>
      <input type="hidden" name="follow" value={seller.isFollowing?'false':'true'}/>
      <button className={seller.isFollowing?'button secondary seller-follow-button':'button seller-follow-button'} type="submit">{seller.isFollowing?'Following':'Follow'}</button>
    </form>;

  return <main id="main" className="container seller-page">
    {query.error?<div className="form-notice error" role="alert">{query.error==='follow'?'Unable to update your follow right now. Please try again.':'Seller features are unavailable right now.'}</div>:null}

    {seller.bannerUrl?<div className="seller-store-banner"><img src={seller.bannerUrl} alt=""/></div>:null}

    <SellerProfileCard seller={seller} actions={followAction}/>

    <nav className="seller-store-nav" aria-label="Store sections">
      <Link className={active==='home'?'active':''} href={`/seller/${seller.id}`}>Home</Link>
      <Link className={active==='all'?'active':''} href={{pathname:`/seller/${seller.id}`,query:{section:'all'}}}>All Products</Link>
      {sections.map(section=><Link
        className={active===section.name?'active':''}
        href={{pathname:`/seller/${seller.id}`,query:{section:section.name}}}
        key={section.name}
      >{section.name}</Link>)}
    </nav>

    {seller.isOwner?<StoreCustomizer
      bannerUrl={seller.bannerUrl||''}
      initialSections={sections}
      products={products.map(product=>({id:product.id,name:product.name}))}
    />:null}

    <section className="seller-products-section">
      <div className="section-heading"><div><p className="eyebrow">FROM THIS STORE</p><h1>{heading}</h1></div></div>
      {visibleProducts.length?<div className="product-grid">{visibleProducts.map(product=><ProductCard key={product.id} product={product}/>)}</div>:<div className="empty-state seller-section-empty-state"><h2>No products here yet</h2><p>{active==='home'?'This seller does not currently have any approved products.':'This section does not have any products yet.'}</p></div>}
    </section>
  </main>;
}
