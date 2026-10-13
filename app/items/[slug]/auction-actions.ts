'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { configured, db } from '@/lib/supabase';

export type BidActionState={error?:string;success?:string};

const UUID_RE=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const SLUG_RE=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function placeProductBid(_:BidActionState,form:FormData):Promise<BidActionState>{
  if(!configured())return {error:'Bidding is not configured yet.'};

  const productId=String(form.get('product_id')||'');
  const slug=String(form.get('slug')||'');
  const rawAmount=String(form.get('amount')||'').trim();

  if(!UUID_RE.test(productId)||!SLUG_RE.test(slug))return {error:'Invalid auction product.'};

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect(`/auth?next=${encodeURIComponent(`/items/${slug}`)}`);

  if(!/^\d{1,10}(?:\.\d{1,2})?$/.test(rawAmount))return {error:'Enter a valid bid amount.'};
  const amount=Number(rawAmount);
  if(!Number.isFinite(amount)||amount<=0||amount>9999999999.99)return {error:'Enter a valid bid amount.'};

  const result=await client.rpc('marketplace_place_bid',{
    p_product_id:productId,
    p_amount:amount,
  });

  if(result.error){
    const message=result.error.message;
    if(message.includes('own product'))return {error:'You cannot bid on your own product.'};
    if(message.includes('has ended'))return {error:'This auction has already ended.'};
    if(message.includes('has not started'))return {error:'This auction has not started yet.'};
    if(message.includes('Bid must be at least')){
      const match=message.match(/Bid must be at least ([0-9.]+)/);
      return {error:match?`Your bid must be at least RM ${Number(match[1]).toFixed(2)}.`:'Your bid is below the current minimum.'};
    }
    return {error:'Unable to place this bid. Refresh the page and try again.'};
  }

  revalidatePath(`/items/${slug}`);
  return {success:'Your bid has been placed.'};
}
