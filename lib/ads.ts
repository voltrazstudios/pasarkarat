import { configured, db } from '@/lib/supabase';

export type ActiveAd={
  id:string;
  title:string;
  destinationUrl:string;
  desktopImage:string;
  mobileImage:string;
  weight:number;
};

type ActiveAdRow={
  id:string;
  title:string;
  destination_url:string;
  public_desktop_path:string;
  public_mobile_path:string;
  weight:number|string;
};

export async function activeAds():Promise<ActiveAd[]>{
  if(!configured())return [];
  const client=await db();
  const result=await client.rpc('marketplace_active_ads');
  if(result.error||!Array.isArray(result.data))return [];

  return (result.data as ActiveAdRow[])
    .filter(row=>row.public_desktop_path&&row.public_mobile_path&&Number(row.weight)>0)
    .map(row=>({
      id:row.id,
      title:row.title,
      destinationUrl:row.destination_url,
      desktopImage:client.storage.from('marketplace-ad-images').getPublicUrl(row.public_desktop_path).data.publicUrl,
      mobileImage:client.storage.from('marketplace-ad-images').getPublicUrl(row.public_mobile_path).data.publicUrl,
      weight:Math.max(1,Math.min(25,Number(row.weight)||1)),
    }));
}
