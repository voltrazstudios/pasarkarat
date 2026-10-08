'use client';

import Link from 'next/link';
import Image from 'next/image';
import imageAssets from '@/data/image-assets.json';
import { SaveButton } from './saved-items';
import { PlatformQuickLinks, PlatformSummary, ProductName, platformClass } from './platform-links';
import { useState, type CSSProperties } from 'react';
import { useLanguage } from './language-provider';
import { ArrowUpRight, ArrowRight, Search, Layers, Image as ImageIcon, X } from 'lucide-react';
import { categories, categoryImages, platformDisplayName, platforms, products, type Platform, type Product } from '@/data/products';
import { contrastText, darkenHexColor, storeFontFamily, type StoreFont } from '@/lib/store-theme';

export { Header } from './header';

export function ProductImage({
  src,
  name,
  category,
  hero=false,
  sizes="(max-width: 900px) 100vw, 750px"
}:{
  src:string;
  name:string;
  category?:string;
  hero?:boolean;
  sizes?:string;
}){
  const [failed,setFailed]=useState(false);
  const [loaded,setLoaded]=useState(false);

  return <div className={`image-placeholder ${hero?'hero-placeholder':''}`}>
    <div className="placeholder-grid"/>
    {!failed&&src&&(!src.startsWith('/')||imageAssets.includes(src))&&(
      src.startsWith('/')?
        <Image
          src={src}
          alt={name}
          fill
          sizes={hero?"(max-width: 600px) 100vw, 50vw":sizes}
          priority={hero}
          style={{opacity:loaded?1:0}}
          onLoad={()=>setLoaded(true)}
          ref={node=>{if(node?.complete && node.naturalWidth>0)setLoaded(true);}}
          onError={()=>setFailed(true)}
        />:
        <img
          src={src}
          alt={name}
          onLoad={()=>setLoaded(true)}
          onError={()=>setFailed(true)}
          style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:loaded?1:0}}
        />
    )}
    <div className="placeholder-label">
      <ImageIcon size={hero?38:27} strokeWidth={1}/>
      <span>{hero?'A space for stories & discoveries':'Image coming soon'}</span>
      {hero&&<small>Your Pasar Karat collection, pictured here.</small>}
    </div>
    {category&&<span className="image-category">{category}</span>}
  </div>;
}

export function ProductCard({product:p}:{product:Product}){
  const {language}=useLanguage();
  const displayName=language==='ms'?p.nameMs:p.name;
  const boosted=Boolean(p.boostedUntil&&new Date(p.boostedUntil).getTime()>Date.now());
  return <article className="product-card">
    <Link href={`/items/${p.slug}`} className="product-image-link" aria-label={`View ${displayName}`}>
      <ProductImage
        src={p.image}
        name={displayName}
        category={p.category}
        sizes="(max-width: 379px) 100vw, (max-width: 900px) 50vw, (max-width: 1100px) 33vw, 25vw"
      />
      {boosted?<span className="product-boost-badge">Boosted</span>:null}
    </Link>
    <div className="product-content">
      <p className="seller"><PlatformSummary links={p.links}/></p>
      <h3><Link href={`/items/${p.slug}`}><ProductName product={p}/></Link></h3>
      <div className="product-bottom">
        <strong className="compare-sellers">
          {p.price!=null
            ? new Intl.NumberFormat('en-MY',{style:'currency',currency:p.currency??'MYR'}).format(p.price)
            : 'Compare Seller Price'}
        </strong>
        <Link href={`/items/${p.slug}`} className="view-item">View Item <ArrowUpRight size={15}/></Link>
      </div>
      <div className="product-card-actions">
        <SaveButton id={p.id} name={displayName}/>
        <PlatformQuickLinks links={p.links}/>
      </div>
    </div>
  </article>;
}

export function CategoryLinks(){
  return <section className="container category-section" id="categories">
    <div className="section-heading">
      <div><p className="eyebrow">FOLLOW YOUR CURIOSITY</p><h2>Find your kind of treasure</h2></div>
      <Link href="/items" className="text-link">Browse all items <ArrowRight size={17}/></Link>
    </div>
    <div className="categories">
      {categories.map(category=><Link href={`/items?category=${encodeURIComponent(category)}`} key={category} className="category">
        <span className="category-art"><Image src={categoryImages[category]} alt="" width={64} height={64} sizes="64px"/></span>
        {category}
      </Link>)}
    </div>
  </section>;
}

type HomeFeaturedStore={
  id:string;
  storeName:string;
  description:string|null;
  avatarUrl:string|null;
  productCount:number;
  featuredUntil:string;
  isPro:boolean;
  accentColor:string;
  cardColor:string;
  storeFont:StoreFont;
};

export function Home({items=products,featuredStores=[]}:{items?:Product[];featuredStores?:HomeFeaturedStore[]}){
  const {language}=useLanguage();
  const now=Date.now();
  const activeBoosts=items.filter(item=>item.boostedUntil&&new Date(item.boostedUntil).getTime()>now);
  const staticFeatured=products.filter(item=>item.featured);
  const featuredFinds=[...activeBoosts,...staticFeatured.filter(item=>!activeBoosts.some(boost=>boost.id===item.id))].slice(0,4);
  const moreToDiscover=items.filter(item=>!featuredFinds.some(feature=>feature.id===item.id)).slice(0,4);
  return <main id="main">
    <section className="hero container">
      <div className="hero-copy">
        <p className="eyebrow"><span className="small-line"/> THE SPIRIT OF PASAR KARAT, ONLINE</p>
        <h1>Discover Unique Finds<br/>from <em>Pasar Karat</em></h1>
        <p>Explore vintage items, antiques, traditional crafts and collectibles from independent sellers.</p>
        <Link href="/items" className="button">Explore Collection <ArrowUpRight size={19}/></Link>
        <div className="hero-foot"><span>Vintage charm</span><i/><span>Local heritage</span><i/><span>Everyday discoveries</span></div>
      </div>
      <div className="hero-visual">
        <ProductImage src="/images/hero/market.webp" name="Pasar Karat market" hero/>
        <div className="hero-tag"><span className="tag-icon"><Layers size={24}/></span><span>A new chapter for old treasures<small>Find something with a story.</small></span></div>
      </div>
    </section>

    <CategoryLinks/>

    {featuredStores.length?<section className="container featured-store-section">
      <div className="section-heading">
        <div><p className="eyebrow">FEATURED SELLERS</p><h2>Stores worth discovering</h2></div>
        <Link href="/items" className="text-link">Explore the collection <ArrowRight size={17}/></Link>
      </div>
      <div className="featured-store-grid">
        {featuredStores.map(store=>{
          const themeStyle=store.isPro?{
            '--featured-card':store.cardColor,
            '--featured-card-text':contrastText(store.cardColor),
            '--featured-accent':store.accentColor,
            '--featured-accent-text':contrastText(store.accentColor),
            '--featured-card-border':darkenHexColor(store.cardColor,.12),
            '--featured-font':storeFontFamily(store.storeFont),
          } as CSSProperties:undefined;
          return <Link
            href={`/seller/${store.id}`}
            className={`featured-store-card${store.isPro?' featured-store-card-pro':''}`}
            style={themeStyle}
            key={store.id}
          >
            <span className="featured-store-avatar">
              {store.avatarUrl?<img src={store.avatarUrl} alt=""/>:<span>{store.storeName.slice(0,1).toUpperCase()}</span>}
            </span>
            <span className="featured-store-copy">
              <small>FEATURED STORE</small>
              <strong>{store.storeName}</strong>
              <span>{store.description||`${store.productCount} approved ${store.productCount===1?'product':'products'}`}</span>
            </span>
            <ArrowUpRight size={18}/>
          </Link>;
        })}
      </div>
    </section>:null}

    <section className="container collection">
      <div className="section-heading">
        <div><p className="eyebrow">WORTH A CLOSER LOOK</p><h2>Featured finds</h2></div>
        <Link href="/items" className="text-link">Explore the collection <ArrowRight size={17}/></Link>
      </div>
      <p className="demo-note">{language==='ms'?'Pautan penjual luar · Harga dan ketersediaan mungkin berubah.':'External seller links · Prices and availability may change.'}</p>
      <div className="product-grid">{featuredFinds.map(p=><ProductCard key={p.id} product={p}/>)}</div>
    </section>

    <section className="container story">
      <div><p className="eyebrow">MORE THAN SOMETHING OLD</p><h2>A market full of character.<br/>A connection to our heritage.</h2></div>
      <div><p>From a radio that brings back memories to a craft that carries tradition, Pasar Karat is a place for curious discoveries. We bring that spirit online, helping you find vintage, traditional and collectible items from independent sellers.</p><Link href="/about" className="text-link">Get to know Pasar Karat <ArrowRight size={17}/></Link></div>
    </section>

    <section className="container collection">
      <div className="section-heading">
        <div><p className="eyebrow">KEEP EXPLORING</p><h2>More to discover</h2></div>
        <Link href="/items" className="text-link">View all items <ArrowRight size={17}/></Link>
      </div>
      <div className="product-grid">{moreToDiscover.map(p=><ProductCard key={p.id} product={p}/>)}</div>
    </section>
  </main>;
}

export function Catalogue({initialQuery='',initialCategory='',items=products}:{initialQuery?:string;initialCategory?:string;items?:Product[]}){
  const {language}=useLanguage();
  const [query,setQuery]=useState(initialQuery);
  const [category,setCategory]=useState(initialCategory);
  const [platform,setPlatform]=useState<Platform | ''>('');
  const platformFilters: Platform[]=[...platforms];
  const filtered=items.filter(p=>(!category||p.category===category)&&(!platform||p.links.some(link=>link.platform===platform))&&`${p.name} ${p.category} ${p.description} ${p.links.map(link=>link.platform).join(' ')}`.toLowerCase().includes(query.toLowerCase().trim()));

  return <main id="main" className="container catalogue">
    <p className="eyebrow">THE DIGITAL PASAR KARAT</p>
    <div className="catalogue-heading-row">
      <div className="catalogue-heading-copy">
        <h1>Explore the collection</h1>
        <p className="intro">A little nostalgia. A touch of tradition. Something that speaks to you.</p>
      </div>
      <div className="collection-submit-mini">
        <span><strong>Sell something unique?</strong><small>Submit it for review.</small></span>
        <Link href="/submit-product" prefetch className="button submission-cta">Submit Product <ArrowUpRight size={17}/></Link>
      </div>
    </div>
    <div className="catalogue-controls">
      <label className="filter-search">
        <Search size={19}/>
        <input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search collection" placeholder="Find your next discovery..."/>
        {query&&<button onClick={()=>setQuery('')} aria-label="Clear search"><X size={18}/></button>}
      </label>
    </div>
    <div className="filter-group">
      <p className="filter-label">{language==='ms'?'Kategori':'Category'}</p>
      <div className="filter-pills">
        <button className={!category?'selected':''} onClick={()=>setCategory('')}>{language==='ms'?'Semua item':'All items'}</button>
        {categories.map(c=><button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}
      </div>
    </div>
    <div className="filter-group platform-filter-group">
      <p className="filter-label">Platform</p>
      <div className="filter-pills platform-filter-pills">
        <button className={!platform?'selected':''} onClick={()=>setPlatform('')}>{language==='ms'?'Semua platform':'All platforms'}</button>
        {platformFilters.map(p=><button key={p} className={`${platform===p?'selected ':''}platform-filter-${platformClass(p)}`} onClick={()=>setPlatform(p)}>{platformDisplayName(p)}</button>)}
      </div>
    </div>
    <div className="results-meta"><span role="status">{filtered.length} {filtered.length===1?'item':'items'}{category?` in ${category}`:''}</span><span>{language==='ms'?'Senarai penjual luar':'External seller listings'}</span></div>
    {filtered.length?
      <div className="product-grid">{filtered.map(p=><ProductCard key={p.id} product={p}/>)}</div>:
      <div className="empty-state"><Search size={32}/><h2>No treasures found just yet</h2><p>Try another search or explore a different category.</p><button className="button" onClick={()=>{setQuery('');setCategory('');setPlatform('');}}>Reset filters <ArrowRight size={18}/></button></div>
    }
  </main>;
}

export function Footer(){
  return <footer>
    <div className="container footer-top">
      <div className="footer-brand">
        <Link href="/" className="brand"><Image className="brand-logo" src="/pasar-karat-logo.png" width={1200} height={300} sizes="240px" alt="Pasar Karat"/></Link>
        <p>Some external links may be affiliate links. Pasar Karat Digital Marketplace may receive a commission from qualifying purchases.</p>
      </div>
      <div className="footer-links"><h2>Product</h2><nav aria-label="Footer product navigation"><Link href="/about">About the Marketplace</Link><Link href="/items">Explore Collection</Link><Link href="/experience">Virtual Experience</Link></nav></div>
      <div className="footer-links"><h2>Legal</h2><nav aria-label="Footer legal navigation"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link></nav></div>
    </div>
    <div className="container footer-bottom"><p>© 2026 Voltraz Studios. All rights reserved.</p></div>
  </footer>;
}
