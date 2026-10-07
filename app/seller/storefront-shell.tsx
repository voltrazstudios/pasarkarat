'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';
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
  const heading=active==='all'?'All Products':active==='home'?'Home':active;

  function activate(event:MouseEvent<HTMLAnchorElement>,next:string,href:string){
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    if(next===active)return;
    setActive(next);
    window.history.pushState(null,'',href);
  }

  const storeAction=seller.isOwner?<>
    <Link href={`/seller/${seller.id}?customize=1#customize-store`} className="seller-store-link">Customize Store</Link>
    <Link href="/my-submissions" prefetch className="seller-store-link">My Submission</Link>
  </>:
    <form action={setSellerFollow}>
      <input type="hidden" name="seller_id" value={seller.id}/>
      <input type="hidden" name="follow" value={seller.isFollowing?'false':'true'}/>
      <button className={seller.isFollowing?'button secondary seller-follow-button':'button seller-follow-button'} type="submit">{seller.isFollowing?'Following':'Follow'}</button>
    </form>;

  return <>
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
  </>;
}
