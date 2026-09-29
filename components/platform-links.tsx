import { ArrowUpRight } from 'lucide-react';
import type { Platform, ProductLink } from '@/data/products';

const platformLabel: Record<Platform, string> = {
  Shopee: 'Shopee',
  Carousell: 'Carousell',
  Facebook: 'Facebook',
};

export function PlatformMark({platform}:{platform:Platform}){
  const mark = platform === 'Facebook' ? 'f' : platform === 'Shopee' ? 'S' : 'C';
  return <span className={`platform-mark platform-${platform.toLowerCase()}`} aria-hidden="true">{mark}</span>;
}

export function PlatformSummary({links}:{links:ProductLink[]}){
  const platforms=[...new Set(links.map(link=>link.platform))];
  return <span className="platform-summary-list">
    {platforms.map(platform=><span className="platform-name" key={platform}><PlatformMark platform={platform}/>{platformLabel[platform]}</span>)}
  </span>;
}

export function PlatformIconLinks({links}:{links:ProductLink[]}){
  const firstByPlatform=[...new Map(links.map(link=>[link.platform,link])).values()];
  return <div className="platform-icon-links" aria-label="Available marketplaces">
    {firstByPlatform.map(link=><a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer sponsored" className={`platform-icon-link platform-${link.platform.toLowerCase()}`} aria-label={`View on ${link.platform}`} title={`View on ${link.platform}`}><PlatformMark platform={link.platform}/></a>)}
  </div>;
}

export function SellerButtons({links}:{links:ProductLink[]}){
  const totals=links.reduce<Record<string,number>>((acc,link)=>{acc[link.platform]=(acc[link.platform]??0)+1;return acc;},{});
  const seen:Record<string,number>={};
  return <div className="seller-buttons">
    {links.map((link,index)=>{
      seen[link.platform]=(seen[link.platform]??0)+1;
      const suffix=(totals[link.platform]??0)>1?` ${seen[link.platform]}`:'';
      return <a key={`${link.platform}-${index}`} className={`seller-platform-button platform-${link.platform.toLowerCase()}`} href={link.url} target="_blank" rel="noopener noreferrer sponsored"><span><PlatformMark platform={link.platform}/>View on {link.platform}{suffix}</span><ArrowUpRight size={19}/></a>;
    })}
  </div>;
}
