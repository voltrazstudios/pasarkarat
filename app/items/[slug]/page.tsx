import { SaveButton } from '@/components/saved-items';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Store, ArrowLeft } from 'lucide-react';
import { collectionProducts, getProductBySlug } from '@/lib/products';
import { ProductCard, ProductImage } from '@/components/marketplace';
import { SellerProfileCard } from '@/components/seller-profile-card';
import { sellerSummary } from '@/lib/sellers';
import { productPriceLabel } from '@/lib/product-price';
import { AvailablePlatformsLabel, CompareSellerPrices, PlatformSummary, ProductDescription, ProductName, PurchaseNote, SellerButtons } from '@/components/platform-links';
import { ProductViewTracker } from '@/components/product-analytics';
import { ProductAuction, type PublicAuction } from '@/components/product-auction';
import { RareProductStory } from '@/components/rare-product-story';
import { configured, db } from '@/lib/supabase';

export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const p=await getProductBySlug(slug);return {title:p?.name??'Item not found',description:p?.description};
}
export default async function Page({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const p=await getProductBySlug(slug);
  if(!p)notFound();
  const [allProducts,seller]=await Promise.all([collectionProducts(),p.sellerId?sellerSummary(p.sellerId):Promise.resolve(null)]);
  let auction:PublicAuction|null=null;
  if(p.submitted&&p.listingType==='rare_limited'&&configured()){
    const client=await db();
    const result=await client.rpc('marketplace_public_auction',{p_product_id:p.id});
    if(!result.error&&result.data)auction=result.data as PublicAuction;
  }
  const related=[...allProducts.filter(x=>x.id!==p.id&&x.category===p.category),...allProducts.filter(x=>x.id!==p.id&&x.category!==p.category)].slice(0,4);
  return <main id="main" className="container item-page">
    <ProductViewTracker productId={p.submitted?p.id:null}/>
    <Link href="/items" className="text-link back"><ArrowLeft size={16}/> Back to collection</Link>
    <div className="item-detail item-detail-submitted"><ProductImage key={p.image} src={p.image} name={p.name}/><div className="item-info">
      <div className="item-eyebrow-row">
        {p.listingType==='rare_limited'?<Link className="rare-limited-badge" href="/items?rare=1">Rare &amp; Limited</Link>:null}
        <Link className="eyebrow" href={`/items?category=${encodeURIComponent(p.category)}`}>{p.category}</Link>
      </div>
      <h1><ProductName product={p}/></h1>
      {productPriceLabel(p)?<strong className="detail-price">{productPriceLabel(p)}</strong>:<CompareSellerPrices detail/>}
      <p className="description"><ProductDescription product={p}/></p>
      <div className="seller-box"><Store size={24}/><div><AvailablePlatformsLabel/><PlatformSummary links={p.links}/></div></div>
      <SellerButtons links={p.links} productId={p.submitted?p.id:undefined}/><SaveButton id={p.id} name={p.name}/><p className="purchase-note"><PurchaseNote/></p>
      {auction?<ProductAuction productId={p.id} slug={p.slug} auction={auction} isSeller={Boolean(seller?.isOwner)}/>:null}
    </div></div>
    <RareProductStory product={p}/>
    {seller?<SellerProfileCard seller={seller}/>:null}
    <section className="collection"><div className="section-heading"><div><p className="eyebrow">CONTINUE YOUR DISCOVERY</p><h2>You might also like</h2></div></div><div className="product-grid">{related.map(product=><ProductCard key={product.id} product={product}/>)}</div></section>
  </main>;
}
