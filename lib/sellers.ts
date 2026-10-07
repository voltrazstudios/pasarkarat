import { platformDisplayNames, platforms, type Platform } from '@/data/products';
import { defaultStoreTheme, storeFonts, type StoreFont } from './store-theme';
import { configured, db } from './supabase';

const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export type SellerSummary={
  id:string;
  storeName:string;
  description:string|null;
  avatarUrl:string|null;
  bannerUrl:string|null;
  bannerPositionX:number;
  bannerPositionY:number;
  joinedAt:string;
  ratings:number;
  products:number;
  followers:number;
  isFollowing:boolean;
  isOwner:boolean;
  isPro:boolean;
  accentColor:string;
  pageBackground:string;
  cardColor:string;
  storeFont:StoreFont;
  featuredProductIds:string[];
  customSlug:string|null;
  storeLinks:Partial<Record<Platform,string>>;
};

export type StoreSectionBlock=
  | {type:'subcategory';title:string}
  | {type:'products';productIds:string[]}
  | {type:'image';imagePath:string;imageUrl:string};

export type StoreSection={
  name:string;
  position:number;
  blocks:StoreSectionBlock[];
};

export async function sellerSummary(id:string):Promise<SellerSummary|null>{
  if(!configured()||!uuid.test(id))return null;
  const client=await db();
  const {data,error}=await client.rpc('marketplace_public_seller',{p_seller:id});
  if(error||!data)return null;
  const row=data as Record<string,unknown>;
  if(typeof row.id!=='string'||typeof row.store_name!=='string'||typeof row.joined_at!=='string')return null;
  const rawLinks=row.store_links&&typeof row.store_links==='object'&&!Array.isArray(row.store_links)
    ? row.store_links as Record<string,unknown>
    : {};
  const storeLinks:Partial<Record<Platform,string>>={};
  for(const platform of platforms){
    const value=rawLinks[platform];
    if(typeof value==='string'&&value.startsWith('https://'))storeLinks[platform]=value;
  }

  const storeFont=typeof row.store_font==='string'&&storeFonts.includes(row.store_font as StoreFont)
    ? row.store_font as StoreFont
    : defaultStoreTheme.font;

  return {
    id:row.id,
    storeName:row.store_name,
    description:typeof row.description==='string'&&row.description.trim()?row.description:null,
    avatarUrl:typeof row.avatar_path==='string'&&row.avatar_path
      ? client.storage.from('marketplace-profile-images').getPublicUrl(row.avatar_path).data.publicUrl
      : null,
    bannerUrl:typeof row.banner_path==='string'&&row.banner_path
      ? client.storage.from('marketplace-profile-images').getPublicUrl(row.banner_path).data.publicUrl
      : null,
    bannerPositionX:Number(row.banner_position_x??50),
    bannerPositionY:Number(row.banner_position_y??50),
    joinedAt:row.joined_at,
    ratings:Number(row.ratings||0),
    products:Number(row.products||0),
    followers:Number(row.followers||0),
    isFollowing:row.is_following===true,
    isOwner:row.is_owner===true,
    isPro:row.is_pro===true,
    accentColor:typeof row.accent_color==='string'?row.accent_color:defaultStoreTheme.accentColor,
    pageBackground:typeof row.page_background==='string'?row.page_background:defaultStoreTheme.pageBackground,
    cardColor:typeof row.card_color==='string'?row.card_color:defaultStoreTheme.cardColor,
    storeFont,
    featuredProductIds:Array.isArray(row.featured_product_ids)
      ? row.featured_product_ids.map(String).filter(value=>uuid.test(value)).slice(0,4)
      : [],
    customSlug:typeof row.custom_slug==='string'&&row.custom_slug?row.custom_slug:null,
    storeLinks,
  };
}

export async function sellerSections(id:string):Promise<StoreSection[]>{
  if(!configured()||!uuid.test(id))return [];
  const client=await db();
  const {data,error}=await client.rpc('marketplace_public_store_sections',{p_seller:id});
  if(error||!Array.isArray(data))return [];

  return data.flatMap((entry,index)=>{
    if(!entry||typeof entry!=='object')return [];
    const row=entry as Record<string,unknown>;
    if(typeof row.name!=='string')return [];

    const rawBlocks=Array.isArray(row.content)?row.content:[];
    const blocks:StoreSectionBlock[]=rawBlocks.flatMap(block=>{
      if(!block||typeof block!=='object')return [];
      const item=block as Record<string,unknown>;

      if(item.type==='subcategory'&&typeof item.title==='string'&&item.title.trim()){
        return [{type:'subcategory' as const,title:item.title.trim()}];
      }

      if(item.type==='products'){
        const productIds=Array.isArray(item.product_ids)
          ? item.product_ids.map(String).filter(value=>uuid.test(value))
          : [];
        return [{type:'products' as const,productIds}];
      }

      if(item.type==='image'&&typeof item.image_path==='string'&&item.image_path){
        return [{
          type:'image' as const,
          imagePath:item.image_path,
          imageUrl:client.storage.from('marketplace-profile-images').getPublicUrl(item.image_path).data.publicUrl,
        }];
      }

      return [];
    });

    return [{name:row.name,position:Number(row.position||index+1),blocks}];
  }).slice(0,5);
}


export type SellerProductMetric={
  savedCount:number;
  approvedAt:string;
};

export type SellerProductMetrics=Record<string,SellerProductMetric>;

export async function sellerProductMetrics(id:string):Promise<SellerProductMetrics>{
  if(!configured()||!uuid.test(id))return {};
  const client=await db();
  const {data,error}=await client.rpc('marketplace_public_seller_product_metrics',{p_seller:id});
  if(error||!data||typeof data!=='object'||Array.isArray(data))return {};

  const result:SellerProductMetrics={};
  for(const [productId,value] of Object.entries(data as Record<string,unknown>)){
    if(!uuid.test(productId)||!value||typeof value!=='object'||Array.isArray(value))continue;
    const row=value as Record<string,unknown>;
    result[productId]={
      savedCount:Number(row.saved_count||0),
      approvedAt:typeof row.approved_at==='string'?row.approved_at:'',
    };
  }
  return result;
}


export async function sellerIdBySlug(slug:string):Promise<string|null>{
  const clean=slug.trim().toLowerCase();
  if(!configured()||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean))return null;
  const client=await db();
  const {data,error}=await client.rpc('marketplace_public_seller_id_by_slug',{p_slug:clean});
  return !error&&typeof data==='string'&&uuid.test(data)?data:null;
}

export function sellerStoreLinkLabels(links:Partial<Record<Platform,string>>){
  return platforms.flatMap(platform=>links[platform]
    ? [{platform,label:platformDisplayNames[platform],url:links[platform]!}]
    : []
  );
}
