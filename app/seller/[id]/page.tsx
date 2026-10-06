import { notFound } from 'next/navigation';
import { SellerProfileCard } from '@/components/seller-profile-card';
import { ProductCard } from '@/components/marketplace';
import { collectionProducts } from '@/lib/products';
import { sellerSummary } from '@/lib/sellers';
import { setSellerFollow } from '../actions';

export const dynamic='force-dynamic';

export async function generateMetadata({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const seller=await sellerSummary(id);
  return {title:seller?`${seller.storeName} — Seller`:'Seller not found'};
}

export default async function SellerPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{error?:string}>}){
  const {id}=await params;
  const [seller,allProducts,query]=await Promise.all([sellerSummary(id),collectionProducts(),searchParams]);
  if(!seller)notFound();

  const products=allProducts.filter(product=>product.sellerId===seller.id);

  const followAction=seller.isOwner?null:
    <form action={setSellerFollow}>
      <input type="hidden" name="seller_id" value={seller.id}/>
      <input type="hidden" name="follow" value={seller.isFollowing?'false':'true'}/>
      <button className={seller.isFollowing?'button secondary seller-follow-button':'button seller-follow-button'} type="submit">{seller.isFollowing?'Following':'Follow'}</button>
    </form>;

  return <main id="main" className="container seller-page">
    {query.error?<div className="form-notice error" role="alert">{query.error==='follow'?'Unable to update your follow right now. Please try again.':'Seller features are unavailable right now.'}</div>:null}
    <SellerProfileCard seller={seller} actions={followAction}/>
    <section className="seller-products-section">
      <div className="section-heading"><div><p className="eyebrow">FROM THIS STORE</p><h1>{seller.storeName}&apos;s products</h1></div></div>
      {products.length?<div className="product-grid">{products.map(product=><ProductCard key={product.id} product={product}/>)}</div>:<div className="empty-state"><h2>No products available</h2><p>This seller does not currently have any approved products.</p></div>}
    </section>
  </main>;
}
