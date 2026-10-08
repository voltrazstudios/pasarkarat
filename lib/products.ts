import { platforms, products as staticProducts, type Category, type Platform, type Product } from '@/data/products';
import { configured, db } from './supabase';

type DbLink={platform:string;seller_url:string;affiliate_url:string|null};
type DbProduct={id:string;slug:string;name:string;description:string;price:number|string;min_price:number|string;max_price:number|string;currency:string;category:string;public_image_path:string|null;submitted_by:string;boosted_until:string|null;marketplace_product_links:DbLink[]|null};

function isPlatform(value:string):value is Platform{return platforms.includes(value as Platform);}
function isCategory(value:string):value is Category{return ['Vintage','Antiques','Traditional Crafts','Electronics','Traditional Games','Collectibles','Clothing','Home & Decor'].includes(value);}

async function approvedDatabaseProducts():Promise<Product[]>{
  if(!configured())return [];
  const client=await db();
  const {data,error}=await client.from('marketplace_products')
    .select('id,slug,name,description,price,min_price,max_price,currency,category,public_image_path,submitted_by,boosted_until,marketplace_product_links(platform,seller_url,affiliate_url)')
    .eq('status','approved').order('approved_at',{ascending:false});
  if(error||!data)return [];
  return (data as unknown as DbProduct[]).flatMap(row=>{
    if(!row.public_image_path||!isCategory(row.category))return [];
    const links=(row.marketplace_product_links||[]).filter(link=>isPlatform(link.platform)).map(link=>({platform:link.platform as Platform,url:link.affiliate_url||link.seller_url}));
    if(!links.length)return [];
    const image=client.storage.from('product-images').getPublicUrl(row.public_image_path).data.publicUrl;
    const minPrice=Number(row.min_price??row.price);
    const maxPrice=Number(row.max_price??row.min_price??row.price);
    return [{id:row.id,slug:row.slug,name:row.name,nameMs:row.name,image,category:row.category,description:row.description,descriptionMs:row.description,links,featured:false,price:minPrice,minPrice,maxPrice,currency:'MYR' as const,submitted:true,sellerId:row.submitted_by,boostedUntil:row.boosted_until}];
  });
}
export async function collectionProducts():Promise<Product[]>{
  const now=Date.now();
  const database=await approvedDatabaseProducts();
  database.sort((a,b)=>{
    const aBoost=Boolean(a.boostedUntil&&new Date(a.boostedUntil).getTime()>now);
    const bBoost=Boolean(b.boostedUntil&&new Date(b.boostedUntil).getTime()>now);
    return Number(bBoost)-Number(aBoost);
  });
  return [...database,...staticProducts];
}
export async function getProductBySlug(slug:string):Promise<Product|null>{
  const existing=staticProducts.find(product=>product.slug===slug);
  if(existing)return existing;
  return (await approvedDatabaseProducts()).find(product=>product.slug===slug)||null;
}
