'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from './language-provider';
import type { Platform, Product, ProductLink } from '@/data/products';

const platformLabel: Record<Platform, string> = {
  Shopee: 'Shopee',
  Carousell: 'Carousell',
  Facebook: 'Facebook',
};

const platformLogo: Record<Platform, string> = {
  Shopee: '/images/platforms/shopee.png',
  Carousell: '/images/platforms/carousell.png',
  Facebook: '/images/platforms/facebook.png',
};

const fallbackMark: Record<Platform, string> = {
  Shopee: 'S',
  Carousell: 'C',
  Facebook: 'f',
};

export function PlatformLogo({platform,size=24}:{platform:Platform;size?:number}){
  const [failed,setFailed]=useState(false);
  if(failed){
    return <span className={`platform-logo-fallback platform-${platform.toLowerCase()}`} style={{width:size,height:size}} aria-hidden="true">{fallbackMark[platform]}</span>;
  }
  return <Image className="platform-logo-image" src={platformLogo[platform]} alt="" width={size} height={size} sizes={`${size}px`} onError={()=>setFailed(true)}/>;
}

export function PlatformSummary({links}:{links:ProductLink[]}){
  const platforms=[...new Set(links.map(link=>link.platform))];
  return <span className="platform-summary-list">{platforms.map((platform,index)=><span key={platform}>{index>0&&<span className="platform-separator"> · </span>}{platformLabel[platform]}</span>)}</span>;
}

export function PlatformIndicators({links}:{links:ProductLink[]}){
  const platforms=[...new Set(links.map(link=>link.platform))];
  return <div className="platform-indicators" aria-label="Available marketplaces">
    {platforms.map(platform=><span key={platform} className={`platform-indicator platform-${platform.toLowerCase()}`} title={platform} aria-label={platform}><PlatformLogo platform={platform} size={32}/></span>)}
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
      return <a key={`${link.platform}-${index}`} className={`seller-platform-button platform-${link.platform.toLowerCase()}`} href={link.url} target="_blank" rel="noopener noreferrer sponsored"><span><PlatformLogo platform={link.platform}/>{label}</span><ArrowUpRight size={19}/></a>;
    })}
  </div>;
}
