'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { Search, X } from 'lucide-react';
import { ProductCard } from '@/components/marketplace';
import { SellerProfileCard } from '@/components/seller-profile-card';
import type { Product } from '@/data/products';
import type { SellerProductMetrics, SellerSummary, StoreSection } from '@/lib/sellers';
import { setSellerFollow } from './actions';
import { StoreCustomizer } from './store-customizer';
import { StoreProductsView } from './store-products-view';

function resolveActive(value:string|null,sections:StoreSection[]){
  if(value==='all')return 'all';
  return sections.some(section=>section.name===value)?value||'home':'home';
}

export function SellerStorefrontShell({
  seller,
  sections,
  products,
  metrics,
  initialActive,
  customizing,
}:{
  seller:SellerSummary;
  sections:StoreSection[];
  products:Product[];
  metrics:SellerProductMetrics;
  initialActive:string;
  customizing:boolean;
}){
  const [active,setActive]=useState(initialActive);
  const [searchQuery,setSearchQuery]=useState('');

  useEffect(()=>{
    if(customizing)return;
    const onPopState=()=>{
      const section=new URLSearchParams(window.location.search).get('section');
      setActive(resolveActive(section,sections));
    };
    window.addEventListener('popstate',onPopState);
    return()=>window.removeEventListener('popstate',onPopState);
  },[customizing,sections]);

  const customSection=useMemo(
    ()=>sections.find(section=>section.name===active)||null,
    [active,sections]
  );
  const featuredProducts=useMemo(()=>{
    if(!seller.isPro||active!=='home')return [];
    const ids=new Set(seller.featuredProductIds);
    const normalized=searchQuery.trim().toLowerCase();
    return products.filter(product=>ids.has(product.id)).filter(product=>!normalized||`${product.name} ${product.nameMs} ${product.category} ${product.description} ${product.descriptionMs}`.toLowerCase().includes(normalized));
  },[active,products,searchQuery,seller.featuredProductIds,seller.isPro]);

  const regularProducts=active==='home'&&featuredProducts.length
    ? products.filter(product=>!seller.featuredProductIds.includes(product.id))
    : products;
  const heading=active==='all'?'All Products':active==='home'&&featuredProducts.length?'More from this shop':active==='home'?'Home':active;

  function activate(event:MouseEvent<HTMLAnchorElement>,next:string,href:string){
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    if(next===active)return;
    setActive(next);
    window.history.pushState(null,'',href);
  }

  const storeAction=seller.isOwner?<>
    <Link href={`/seller/${seller.id}?customize=1#customize-store`} className="seller-store-link">Customize Store</Link>
    <Link href="/promote" prefetch className="seller-store-link">Promote</Link>
    <Link href="/my-submissions" prefetch className="seller-store-link">My Submission</Link>
  </>:
    <form action={setSellerFollow}>
      <input type="hidden" name="seller_id" value={seller.id}/>
      <input type="hidden" name="follow" value={seller.isFollowing?'false':'true'}/>
      <button className={seller.isFollowing?'button secondary seller-follow-button':'button seller-follow-button'} type="submit">{seller.isFollowing?'Following':'Follow'}</button>
    </form>;

  return <>
    {!customizing?<div className="seller-store-search">
      <label className="filter-search">
        <Search size={19}/>
        <input
          value={searchQuery}
          onChange={event=>setSearchQuery(event.target.value)}
          aria-label="Search in this shop"
          placeholder="Search In This Shop"
        />
        {searchQuery?<button type="button" onClick={()=>setSearchQuery('')} aria-label="Clear shop search"><X size={18}/></button>:null}
      </label>
    </div>:null}

    <section className="seller-store-panel">
      <SellerProfileCard seller={seller} actions={storeAction}/>

      <nav className="seller-store-nav" aria-label="Store sections" data-preview={customizing?'true':'false'}>
        {customizing?<>
          <span className={active==='home'?'active':''} aria-disabled="true">Home</span>
          <span className={active==='all'?'active':''} aria-disabled="true">All Products</span>
          {sections.map(section=><span className={active===section.name?'active':''} aria-disabled="true" key={section.name}>{section.name}</span>)}
        </>:<>
          <a className={active==='home'?'active':''} href={`/seller/${seller.id}`} onClick={event=>activate(event,'home',`/seller/${seller.id}`)}>Home</a>
          <a className={active==='all'?'active':''} href={`/seller/${seller.id}?section=all`} onClick={event=>activate(event,'all',`/seller/${seller.id}?section=all`)}>All Products</a>
          {sections.map(section=>{
            const href=`/seller/${seller.id}?section=${encodeURIComponent(section.name)}`;
            return <a className={active===section.name?'active':''} href={href} onClick={event=>activate(event,section.name,href)} key={section.name}>{section.name}</a>;
          })}
        </>}
      </nav>
    </section>

    {seller.isOwner?<StoreCustomizer
      bannerUrl={seller.bannerUrl||''}
      initialSections={sections}
      products={products.map(product=>({id:product.id,name:product.name}))}
      initialOpen={customizing}
      sellerId={seller.id}
      isPro={seller.isPro}
      theme={{
        accentColor:seller.accentColor,
        pageBackground:seller.pageBackground,
        cardColor:seller.cardColor,
        font:seller.storeFont,
      }}
      featuredProductIds={seller.featuredProductIds}
      customSlug={seller.customSlug||''}
    />:null}

    {!customizing?<>
      {featuredProducts.length?<section className="seller-featured-products">
        <div className="section-heading seller-store-content-heading"><div><p className="eyebrow">HANDPICKED BY THE SELLER</p><h1>Featured Products</h1></div></div>
        <div className="product-grid">{featuredProducts.map(product=><ProductCard key={product.id} product={product}/>)}</div>
      </section>:null}
      <section className="seller-products-section">
      <div className="section-heading seller-store-content-heading"><h1>{heading}</h1></div>
      <StoreProductsView
        products={regularProducts}
        metrics={metrics}
        section={customSection}
        searchQuery={searchQuery}
        homeLimit={active==='home'?12:undefined}
      />
    </section>
    </>:null}
  </>;
}
