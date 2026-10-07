'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ArrowUpRight, ChevronDown, Grid2X2 } from 'lucide-react';
import { useLanguage } from './language-provider';
import type { Platform, Product, ProductLink } from '@/data/products';

const platformLabel: Record<Platform, string> = {
  Shopee: 'Shopee',
  Carousell: 'Carousell',
  Facebook: 'Facebook',
  'TikTok Shop': 'TikTok Shop',
  'Mudah.my': 'Mudah.my',
  Lazada: 'Lazada',
  'Own website': 'Own website',
};

const platformLogo: Partial<Record<Platform, string>> = {
  Shopee: '/images/platforms/shopee.png',
  Carousell: '/images/platforms/carousell.png',
  Facebook: '/images/platforms/facebook.png',
};

const fallbackMark: Record<Platform, string> = {
  Shopee: 'S',
  Carousell: 'C',
  Facebook: 'f',
  'TikTok Shop': 'T',
  'Mudah.my': 'M',
  Lazada: 'L',
  'Own website': '↗',
};

export function platformClass(platform:Platform){
  return platform.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

export function PlatformLogo({platform,size=24}:{platform:Platform;size?:number}){
  const [failed,setFailed]=useState(false);
  const logo=platformLogo[platform];
  if(failed||!logo){
    return <span className={`platform-logo-fallback platform-${platformClass(platform)}`} style={{width:size,height:size}} aria-hidden="true">{fallbackMark[platform]}</span>;
  }
  return <Image className="platform-logo-image" src={logo} alt="" width={size} height={size} sizes={`${size}px`} onError={()=>setFailed(true)}/>;
}

export function PlatformSummary({links}:{links:ProductLink[]}){
  const values=[...new Set(links.map(link=>link.platform))];
  const visible=values.slice(0,4);
  const hidden=values.length-visible.length;
  return <span className="platform-summary-list">
    {visible.map((platform,index)=><span key={platform}>{index>0&&<span className="platform-separator"> · </span>}{platformLabel[platform]}</span>)}
    {hidden>0?<span className="platform-summary-more"><span className="platform-separator"> · </span>+{hidden} more</span>:null}
  </span>;
}

export function PlatformQuickLinks({links}:{links:ProductLink[]}){
  const unique=links.filter((link,index,all)=>all.findIndex(item=>item.platform===link.platform)===index);
  const visible=unique.slice(0,3);
  const hasMore=unique.length>3;

  return <div className="platform-quick-wrap">
    {!hasMore?<div className="platform-quick-icons" aria-label="Marketplace links">
      {visible.map(link=><a
        key={link.platform}
        className={`platform-indicator platform-quick-icon platform-${platformClass(link.platform)}`}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        aria-label={`Open ${platformLabel[link.platform]} listing`}
        title={platformLabel[link.platform]}
      ><PlatformLogo platform={link.platform} size={32}/></a>)}
    </div>:null}

    {hasMore?<details className="platform-all">
      <summary aria-label={`View all ${unique.length} platforms`}>
        <Grid2X2 size={14}/>
        <span className="platform-all-label">View all platforms ({unique.length})</span>
        <span className="platform-all-label-mobile">All ({unique.length})</span>
        <ChevronDown className="platform-all-chevron" size={15}/>
      </summary>
      <div className="platform-all-popover">
        <div className="platform-all-grid">
          {unique.map(link=><a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={`Open ${platformLabel[link.platform]} listing`}
          >
            <span className={`platform-all-icon platform-${platformClass(link.platform)}`}><PlatformLogo platform={link.platform} size={30}/></span>
            <span>{platformLabel[link.platform]}</span>
          </a>)}
        </div>
      </div>
    </details>:null}
  </div>;
}

export function CompareSellerPrices({detail=false}:{detail?:boolean}){
  const {language}=useLanguage();
  return <strong className={detail?'detail-price':'compare-sellers'}>{language==='ms'?'Bandingkan harga penjual':'Compare seller prices'}</strong>;
}

export function AvailablePlatformsLabel(){
  const {language}=useLanguage();
  return <small>{language==='ms'?'PLATFORM TERSEDIA':'AVAILABLE PLATFORMS'}</small>;
}

export function ProductName({product}:{product:Product}){
  const {language}=useLanguage();
  return <>{language==='ms'?product.nameMs:product.name}</>;
}

export function ProductDescription({product}:{product:Product}){
  const {language}=useLanguage();
  return <>{language==='ms'?product.descriptionMs:product.description}</>;
}

export function PurchaseNote(){
  const {language}=useLanguage();
  return <>{language==='ms'?'Harga, ketersediaan dan pembelian dikendalikan oleh penjual atau platform luar.':'Prices, availability and purchases are handled by the external seller or marketplace.'}</>;
}

export function SellerButtons({links}:{links:ProductLink[]}){
  const {language}=useLanguage();
  const totals=links.reduce<Record<string,number>>((acc,link)=>{acc[link.platform]=(acc[link.platform]??0)+1;return acc;},{});
  const seen:Record<string,number>={};
  return <div className="seller-buttons">
    {links.map((link,index)=>{
      seen[link.platform]=(seen[link.platform]??0)+1;
      const suffix=(totals[link.platform]??0)>1?` ${seen[link.platform]}`:'';
      const label=language==='ms'?`Lihat di ${link.platform}${suffix}`:`View on ${link.platform}${suffix}`;
      return <a key={`${link.platform}-${index}`} className={`seller-platform-button platform-${platformClass(link.platform)}`} href={link.url} target="_blank" rel="noopener noreferrer sponsored"><span><PlatformLogo platform={link.platform}/>{label}</span><ArrowUpRight size={19}/></a>;
    })}
  </div>;
}
