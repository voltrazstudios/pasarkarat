'use client';

import { useMemo, useState } from 'react';
import { ProductCard } from '@/components/marketplace';
import { platforms, type Platform, type Product } from '@/data/products';
import type { SellerProductMetrics, StoreSection } from '@/lib/sellers';

type SortMode='popular'|'latest'|'price-low'|'price-high';

function metricDate(value:string){
  const time=Date.parse(value);
  return Number.isFinite(time)?time:0;
}

export function StoreProductsView({
  products,
  metrics,
  section,
  homeLimit,
}:{
  products:Product[];
  metrics:SellerProductMetrics;
  section?:StoreSection|null;
  homeLimit?:number;
}){
  const [sort,setSort]=useState<SortMode>('popular');
  const [platform,setPlatform]=useState<Platform|''>('');

  const apply=useMemo(()=>{
    return (items:Product[])=>{
      const filtered=platform
        ? items.filter(product=>product.links.some(link=>link.platform===platform))
        : [...items];

      filtered.sort((a,b)=>{
        if(sort==='price-low')return (a.price??Number.POSITIVE_INFINITY)-(b.price??Number.POSITIVE_INFINITY);
        if(sort==='price-high')return (b.price??Number.NEGATIVE_INFINITY)-(a.price??Number.NEGATIVE_INFINITY);
        if(sort==='latest'){
          return metricDate(metrics[b.id]?.approvedAt||'')-metricDate(metrics[a.id]?.approvedAt||'');
        }

        const saved=(metrics[b.id]?.savedCount||0)-(metrics[a.id]?.savedCount||0);
        if(saved!==0)return saved;
        return metricDate(metrics[b.id]?.approvedAt||'')-metricDate(metrics[a.id]?.approvedAt||'');
      });

      return filtered;
    };
  },[metrics,platform,sort]);

  const standardProducts=section?[]:apply(products).slice(0,homeLimit??products.length);

  return <>
    <div className="store-sort-bar" aria-label="Sort and filter store products">
      <span className="store-sort-label">Sort by</span>
      <button
        type="button"
        className={sort==='popular'?'active':''}
        aria-pressed={sort==='popular'}
        onClick={()=>setSort('popular')}
        title="Most saved"
      >Popular</button>
      <button
        type="button"
        className={sort==='latest'?'active':''}
        aria-pressed={sort==='latest'}
        onClick={()=>setSort('latest')}
      >Latest</button>
      <select
        aria-label="Sort by price"
        value={sort==='price-low'||sort==='price-high'?sort:''}
        onChange={event=>{
          const value=event.target.value;
          if(value==='price-low'||value==='price-high')setSort(value);
        }}
      >
        <option value="">Price</option>
        <option value="price-low">Price: Low To High</option>
        <option value="price-high">Price: High To Low</option>
      </select>
      <select
        aria-label="Filter by platform"
        value={platform}
        onChange={event=>setPlatform(event.target.value as Platform|'')}
      >
        <option value="">Platform</option>
        {platforms.map(value=><option value={value} key={value}>{value}</option>)}
      </select>
    </div>

    {section?<div className="seller-custom-section-content">
      {section.blocks.map((block,index)=>{
        if(block.type==='subcategory'){
          return <h2 className="seller-subcategory-heading" key={`subcategory-${index}-${block.title}`}>{block.title}</h2>;
        }

        if(block.type==='image'){
          return <div className="seller-section-image" key={`image-${index}-${block.imagePath}`}><img src={block.imageUrl} alt=""/></div>;
        }

        const selected=apply(products.filter(product=>block.productIds.includes(product.id)));
        return selected.length
          ? <div className="product-grid seller-section-product-grid" key={`products-${index}`}>{selected.map(product=><ProductCard key={product.id} product={product}/>)}</div>
          : <p className="seller-section-block-empty" key={`products-${index}`}>No products match these filters.</p>;
      })}
    </div>:standardProducts.length
      ? <div className="product-grid">{standardProducts.map(product=><ProductCard key={product.id} product={product}/>)}</div>
      : <div className="empty-state seller-section-empty-state"><h2>No products found</h2><p>Try another sort or platform filter.</p></div>}
  </>;
}
