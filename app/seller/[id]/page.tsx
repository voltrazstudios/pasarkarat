import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SellerProfileCard } from '@/components/seller-profile-card';
import { ProductCard } from '@/components/marketplace';
import { collectionProducts } from '@/lib/products';
import { sellerSections, sellerSummary, type StoreSection } from '@/lib/sellers';
import { setSellerFollow } from '../actions';
import { StoreCustomizer } from '../store-customizer';

export const dynamic='force-dynamic';

export async function generateMetadata({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const seller=await sellerSummary(id);
  return {title:seller?`${seller.storeName} — Seller`:'Seller not found'};
}

function CustomSectionContent({
  section,
  products,
}:{
  section:StoreSection;
  products:Awaited<ReturnType<typeof collectionProducts>>;
}){
  return <div className="seller-custom-section-content">
    {section.blocks.map((block,index)=>{
      if(block.type==='subcategory'){
        return <h2 className="seller-subcategory-heading" key={`subcategory-${index}-${block.title}`}>{block.title}</h2>;
      }

      if(block.type==='image'){
        return <div className="seller-section-image" key={`image-${index}-${block.imagePath}`}><img src={block.imageUrl} alt=""/></div>;
      }

      const selected=products.filter(product=>block.productIds.includes(product.id));
      return selected.length
        ? <div className="product-grid seller-section-product-grid" key={`products-${index}`}>{selected.map(product=><ProductCard key={product.id} product={product}/>)}</div>
        : <p className="seller-section-block-empty" key={`products-${index}`}>No products in this block yet.</p>;
    })}
  </div>;
}

export default async function SellerPage({
  params,
  searchParams,
}:{
  params:Promise<{id:string}>;
  searchParams:Promise<{error?:string;section?:string;customize?:string}>;
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
  const customizing=seller.isOwner&&query.customize==='1';

  const visibleProducts=active==='all'
    ? products
    : active==='home'
      ? products.slice(0,4)
      : [];

  const heading=active==='all'?'All Products':active==='home'?'Home':active;

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
      initialOpen={customizing}
      sellerId={seller.id}
    />:null}

    {!customizing?<section className="seller-products-section">
      <div className="section-heading seller-store-content-heading"><h1>{heading}</h1></div>
      {customSection
        ? <CustomSectionContent section={customSection} products={products}/>
        : visibleProducts.length
          ? <div className="product-grid">{visibleProducts.map(product=><ProductCard key={product.id} product={product}/>)}</div>
          : <div className="empty-state seller-section-empty-state"><h2>No products here yet</h2><p>This seller does not currently have any approved products.</p></div>}
    </section>:null}
  </main>;
}
