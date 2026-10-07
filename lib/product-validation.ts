import { isIP } from 'node:net';
import type { Platform } from '@/data/products';

const hosts:Partial<Record<Platform,string[]>>={
  Shopee:['shopee.com.my','shp.ee'],
  Carousell:['carousell.com.my','carousell.sg','carousell.com'],
  Facebook:['facebook.com','fb.com'],
  'TikTok Shop':['tiktok.com'],
  'Mudah.my':['mudah.my'],
  Lazada:['lazada.com.my','lazada.com','lazada.sg'],
};

function allowedHost(hostname:string,roots:string[]){
  const host=hostname.toLowerCase().replace(/\.$/,'');
  return roots.some(root=>host===root||host.endsWith(`.${root}`));
}

function safePublicHostname(hostname:string){
  const host=hostname.toLowerCase().replace(/\.$/,'');
  if(!host||host==='localhost'||isIP(host)!==0)return false;
  if(!host.includes('.'))return false;
  if(['.local','.internal','.localhost','.test','.invalid','.example'].some(suffix=>host.endsWith(suffix)))return false;
  return true;
}

export function validatePlatformUrl(platform:Platform,input:string){
  const raw=input.trim();
  if(!raw||raw.length>2048)return null;
  try{
    const url=new URL(raw);
    if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
    if(!safePublicHostname(url.hostname))return null;
    if(platform!=='Own website'){
      const roots=hosts[platform];
      if(!roots||!allowedHost(url.hostname,roots))return null;
    }
    return url.toString();
  }catch{return null;}
}

export function slugifyProductName(value:string){
  const base=value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70);
  return base||'item';
}
