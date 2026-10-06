import { isIP } from 'node:net';
import type { Platform } from '@/data/products';

const hosts:Record<Platform,string[]>={
  Shopee:['shopee.com.my','shp.ee'],
  Carousell:['carousell.com.my','carousell.sg','carousell.com'],
  Facebook:['facebook.com','fb.com'],
};
function allowedHost(hostname:string,roots:string[]){
  const host=hostname.toLowerCase().replace(/\.$/,'');
  return roots.some(root=>host===root||host.endsWith(`.${root}`));
}
export function validatePlatformUrl(platform:Platform,input:string){
  const raw=input.trim();
  if(!raw||raw.length>2048)return null;
  try{
    const url=new URL(raw);
    if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
    if(isIP(url.hostname)!==0||url.hostname==='localhost')return null;
    if(!allowedHost(url.hostname,hosts[platform]))return null;
    return url.toString();
  }catch{return null;}
}
export function slugifyProductName(value:string){
  const base=value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70);
  return base||'item';
}
