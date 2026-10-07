'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/marketplace';
import { platforms, type Platform, type Product } from '@/data/products';
import type { SellerProductMetrics, StoreSection } from '@/lib/sellers';

type SortMode='popular'|'latest'|'price-low'|'price-high';
const PAGE_SIZE=12;

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
  const [page,setPage]=useState(1);

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

  const allSectionProducts=useMemo(()=>{
    if(!section)return apply(products);
    const ids=new Set(section.blocks.flatMap(block=>block.type==='products'?block.productIds:[]));
    return apply(products.filter(product=>ids.has(product.id)));
  },[apply,products,section]);

  const effectiveLimit=homeLimit??PAGE_SIZE;
  const totalItems=section?allSectionProducts.length:apply(products).length;
  const pageSize=homeLimit??PAGE_SIZE;
  const totalPages=Math.max(1,Math.ceil(totalItems/pageSize));

  useEffect(()=>{
    setPage(1);
  },[sort,platform,section?.name]);

  useEffect(()=>{
    if(page>totalPages)setPage(totalPages);
  },[page,totalPages]);

  const pageStart=(page-1)*pageSize;
  const pageIds=new Set(
    (section?allSectionProducts:apply(products))
      .slice(pageStart,pageStart+effectiveLimit)
      .map(product=>product.id)
  );

  const standardProducts=section
    ? []
    : apply(products).slice(pageStart,pageStart+effectiveLimit);

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

      <div className="store-pagination" aria-label="Product pages">
        <span><strong>{page}</strong>/{totalPages}</span>
        <button type="button" aria-label="Previous page" disabled={page<=1} onClick={()=>setPage(current=>Math.max(1,current-1))}><ChevronLeft size={17}/></button>
        <button type="button" aria-label="Next page" disabled={page>=totalPages} onClick={()=>setPage(current=>Math.min(totalPages,current+1))}><ChevronRight size={17}/></button>
      </div>
    </div>

    {section?<div className="seller-custom-section-content">
      {section.blocks.map((block,index)=>{
        if(block.type==='subcategory'){
          return <h2 className="seller-subcategory-heading" key={`subcategory-${index}-${block.title}`}>{block.title}</h2>;
        }

        if(block.type==='image'){
          return <div className="seller-section-image" key={`image-${index}-${block.imagePath}`}><img src={block.imageUrl} alt=""/></div>;
        }

        const selected=apply(products.filter(product=>block.productIds.includes(product.id)&&pageIds.has(product.id)));
        return selected.length
          ? <div className="product-grid seller-section-product-grid" key={`products-${index}`}>{selected.map(product=><ProductCard key={product.id} product={product}/>)}</div>
          : null;
      })}
      {!allSectionProducts.length?<p className="seller-section-block-empty">No products match these filters.</p>:null}
    </div>:standardProducts.length
      ? <div className="product-grid">{standardProducts.map(product=><ProductCard key={product.id} product={product}/>)}</div>
      : <div className="empty-state seller-section-empty-state"><h2>No products found</h2><p>Try another sort or platform filter.</p></div>}
  </>;
}
