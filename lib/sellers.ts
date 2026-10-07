import { configured, db } from './supabase';

const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export type SellerSummary={
  id:string;
  storeName:string;
  description:string|null;
  avatarUrl:string|null;
  joinedAt:string;
  ratings:number;
  products:number;
  followers:number;
  isFollowing:boolean;
  isOwner:boolean;
};

export async function sellerSummary(id:string):Promise<SellerSummary|null>{
  if(!configured()||!uuid.test(id))return null;
  const client=await db();
  const {data,error}=await client.rpc('marketplace_public_seller',{p_seller:id});
  if(error||!data)return null;
  const row=data as Record<string,unknown>;
  if(typeof row.id!=='string'||typeof row.store_name!=='string'||typeof row.joined_at!=='string')return null;
  return {
    id:row.id,
    storeName:row.store_name,
    description:typeof row.description==='string'&&row.description.trim()?row.description:null,
    avatarUrl:typeof row.avatar_url==='string'?row.avatar_url:null,
    joinedAt:row.joined_at,
    ratings:Number(row.ratings||0),
    products:Number(row.products||0),
    followers:Number(row.followers||0),
    isFollowing:row.is_following===true,
    isOwner:row.is_owner===true,
  };
}
