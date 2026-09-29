import { SaveButton } from '@/components/saved-items';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Store, ArrowLeft } from 'lucide-react';
import { products } from '@/data/products';
import { ProductCard, ProductImage } from '@/components/marketplace';
import { AvailablePlatformsLabel, CompareSellerPrices, PlatformSummary, ProductDescription, ProductName, PurchaseNote, SellerButtons } from '@/components/platform-links';

export function generateStaticParams(){
  return products.map(p=>({slug:p.slug}));
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const p=products.find(p=>p.slug===slug);
  return {title:p?.name??'Item not found',description:p?.description};
}

export default async function Page({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const p=products.find(p=>p.slug===slug);
  if(!p)notFound();

  const related=[
    ...products.filter(x=>x.id!==p.id&&x.category===p.category),
    ...products.filter(x=>x.id!==p.id&&x.category!==p.category)
  ].slice(0,4);

  return <main id="main" className="container item-page">
    <Link href="/items" className="text-link back"><ArrowLeft size={16}/> Back to collection</Link>
    <div className="item-detail">
      <ProductImage key={p.image} src={p.image} name={p.name}/>
      <div className="item-info">
        <Link className="eyebrow" href={`/items?category=${encodeURIComponent(p.category)}`}>{p.category}</Link>
        <h1><ProductName product={p}/></h1>
        <CompareSellerPrices detail/>
        <p className="description"><ProductDescription product={p}/></p>
        <div className="seller-box">
          <Store size={24}/>
          <div>
            <AvailablePlatformsLabel/>
            <PlatformSummary links={p.links}/>
          </div>
        </div>
        <SellerButtons links={p.links}/>
        <SaveButton id={p.id} name={p.name}/>
        <p className="purchase-note"><PurchaseNote/></p>
      </div>
    </div>

    <section className="collection">
      <div className="section-heading"><div><p className="eyebrow">CONTINUE YOUR DISCOVERY</p><h2>You might also like</h2></div></div>
      <div className="product-grid">{related.map(product=><ProductCard key={product.id} product={product}/>)}</div>
    </section>
  </main>;
}
