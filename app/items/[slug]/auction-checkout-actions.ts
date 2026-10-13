'use server';

import { redirect } from 'next/navigation';
import { BillplzRequestError, billplzConfigured, createBillplzBill } from '@/lib/billplz';
import { configured, db } from '@/lib/supabase';
import { serviceConfigured, serviceDb } from '@/lib/supabase-service';

const UUID_RE=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const SLUG_RE=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ACCESS_FEE_SEN=100;

export async function startAuctionAccessCheckout(form:FormData){
  const productId=String(form.get('product_id')||'');
  const slug=String(form.get('slug')||'');

  if(!UUID_RE.test(productId)||!SLUG_RE.test(slug))redirect('/items');
  if(!configured())redirect(`/items/${slug}?auction_error=not-configured`);

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect(`/auth?next=${encodeURIComponent(`/items/${slug}`)}`);
  if(!user.email)redirect(`/items/${slug}?auction_error=email-required`);
  if(!billplzConfigured()||!serviceConfigured())redirect(`/items/${slug}?auction_error=payment-not-configured`);

  const product=await client.from('marketplace_products')
    .select('id,name,slug,submitted_by,status,listing_type')
    .eq('id',productId)
    .eq('slug',slug)
    .eq('status','approved')
    .eq('listing_type','rare_limited')
    .maybeSingle();

  if(product.error||!product.data)redirect(`/items/${slug}?auction_error=unavailable`);
  if(product.data.submitted_by===user.id)redirect(`/items/${slug}?auction_error=own-auction`);

  const auction=await client.rpc('marketplace_public_auction',{p_product_id:productId});
  if(auction.error||!auction.data||auction.data.status!=='live')redirect(`/items/${slug}?auction_error=unavailable`);
  if(auction.data.has_bid_access)redirect(`/items/${slug}`);

  const {data:profile}=await client.from('marketplace_profiles')
    .select('display_name,full_name')
    .eq('id',user.id)
    .maybeSingle();

  let checkoutUrl='';
  let stage:'billplz'|'database'='billplz';

  try{
    const bill=await createBillplzBill({
      amount:ACCESS_FEE_SEN,
      email:user.email,
      name:profile?.full_name||profile?.display_name||'Pasar Karat Bidder',
      description:`Auction access — ${product.data.name}`,
      callbackPath:'/api/billplz/auction-access/callback',
      redirectPath:`/items/${slug}?auction_payment=processing`,
    });

    stage='database';
    const admin=serviceDb();
    const registered=await admin.from('marketplace_auction_access_payments').insert({
      bill_id:bill.id,
      product_id:productId,
      user_id:user.id,
      amount:ACCESS_FEE_SEN,
      status:'due',
    });

    if(registered.error)throw new Error('Unable to register auction access payment.');
    checkoutUrl=bill.url;
  }catch(error){
    console.error('[Auction access checkout] failed',{stage,error});
    if(error instanceof BillplzRequestError){
      redirect(`/items/${slug}?auction_error=billplz&status=${error.status}`);
    }
    redirect(`/items/${slug}?auction_error=${stage==='database'?'payment-database':'payment'}`);
  }

  redirect(checkoutUrl);
}
