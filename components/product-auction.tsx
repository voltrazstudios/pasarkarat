'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gavel, Trophy, UsersRound } from 'lucide-react';
import { placeProductBid } from '@/app/items/[slug]/auction-actions';
import { startAuctionAccessCheckout } from '@/app/items/[slug]/auction-checkout-actions';

export type AuctionBidder={
  user_id:string;
  display_name:string;
  avatar_path:string|null;
  avatar_url?:string|null;
  amount:number|string;
};

export type PublicAuction={
  status:'pending'|'upcoming'|'live'|'ended';
  starting_bid:number|string;
  min_increment:number|string;
  starts_at:string|null;
  ends_at:string|null;
  bid_count:number|string;
  current_bid:number|string|null;
  next_minimum_bid:number|string;
  winner_name:string|null;
  bidders:AuctionBidder[];
  has_bid_access:boolean;
  access_fee_sen:number;
};

function money(value:number|string|null){
  if(value==null)return '—';
  return new Intl.NumberFormat('en-MY',{style:'currency',currency:'MYR'}).format(Number(value));
}

function timeLeft(target:string|null,now:number){
  if(!target)return '';
  const milliseconds=Math.max(0,new Date(target).getTime()-now);
  const totalSeconds=Math.floor(milliseconds/1000);
  const days=Math.floor(totalSeconds/86400);
  const hours=Math.floor((totalSeconds%86400)/3600);
  const minutes=Math.floor((totalSeconds%3600)/60);
  const seconds=totalSeconds%60;
  if(days>0)return `${days}d ${hours}h ${minutes}m`;
  if(hours>0)return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function ProductAuction({
  productId,
  slug,
  auction,
  isSeller=false,
  paymentProcessing=false,
}:{
  productId:string;
  slug:string;
  auction:PublicAuction;
  isSeller?:boolean;
  paymentProcessing?:boolean;
}){
  const [state,action,pending]=useActionState(placeProductBid,{});
  const [now,setNow]=useState(Date.now());
  const router=useRouter();
  const endRefreshSent=useRef(false);

  useEffect(()=>{
    const timer=window.setInterval(()=>setNow(Date.now()),1000);
    return()=>window.clearInterval(timer);
  },[]);

  const ended=auction.status==='ended'||Boolean(auction.ends_at&&new Date(auction.ends_at).getTime()<=now);
  const live=auction.status==='live'&&!ended;

  useEffect(()=>{
    if(auction.status==='live'&&ended&&!endRefreshSent.current){
      endRefreshSent.current=true;
      router.refresh();
    }
  },[auction.status,ended,router]);

  useEffect(()=>{
    if(state.success)router.refresh();
  },[router,state.success]);

  const countdown=useMemo(()=>timeLeft(auction.ends_at,now),[auction.ends_at,now]);
  const hasBids=Number(auction.bid_count)>0;
  const accessFee=Number(auction.access_fee_sen||100)/100;

  return <section className="product-auction product-auction-wide" aria-label="Product auction">
    <div className="auction-live-heading">
      <span className="auction-icon"><Gavel size={21}/></span>
      <div>
        <p className="eyebrow">{ended?'AUCTION ENDED':live?'LIVE BIDDING':'AUCTION'}</p>
        <h2>{ended?'Bidding has closed':'Bid for this Rare & Limited piece'}</h2>
      </div>
      {live?<span className="auction-live-pill">LIVE</span>:null}
    </div>

    <div className="auction-stat-grid">
      <div>
        <span>{hasBids?'Current bid':'Starting bid'}</span>
        <strong>{money(hasBids?auction.current_bid:auction.starting_bid)}</strong>
      </div>
      <div>
        <span>Bids</span>
        <strong><UsersRound size={17}/>{Number(auction.bid_count).toLocaleString('en-MY')}</strong>
      </div>
      <div>
        <span>{ended?'Ended':'Time left'}</span>
        <strong>{ended?(auction.ends_at?new Date(auction.ends_at).toLocaleString('en-MY'):'—'):countdown||'—'}</strong>
      </div>
    </div>

    {auction.bidders?.length?<div className="auction-leaderboard">
      <div className="auction-leaderboard-heading"><strong>Top bidders</strong><span>Highest bid per bidder</span></div>
      <div className="auction-bidder-list">
        {auction.bidders.slice(0,3).map((bidder,index)=><div className={`auction-bidder-row rank-${index+1}`} key={bidder.user_id}>
          <span className="auction-rank">#{index+1}</span>
          <span className="auction-bidder-avatar">{bidder.avatar_url?<img src={bidder.avatar_url} alt=""/>:<span>{bidder.display_name.slice(0,1).toUpperCase()}</span>}</span>
          <strong>{bidder.display_name}</strong>
          <b>{money(bidder.amount)}</b>
        </div>)}
      </div>
    </div>:null}

    {ended?<div className="auction-winner">
      <Trophy size={23}/>
      <div>
        <span>{hasBids?'Winning bidder':'Result'}</span>
        <strong>{hasBids?(auction.winner_name||'Marketplace bidder'):'No bids were placed'}</strong>
        {hasBids?<small>Winning bid: {money(auction.current_bid)}</small>:null}
      </div>
    </div>:null}

    {live&&!isSeller&&!auction.has_bid_access?<div className="auction-access-box">
      <div><strong>Unlock bidding</strong><span>Pay once for this auction, then place unlimited bids until it ends.</span></div>
      <form action={startAuctionAccessCheckout}>
        <input type="hidden" name="product_id" value={productId}/>
        <input type="hidden" name="slug" value={slug}/>
        <button className="button" type="submit">Unlock bidding — RM {accessFee.toFixed(2)}</button>
      </form>
      {paymentProcessing?<small>Billplz payment is being confirmed. If you just paid, refresh in a moment.</small>:null}
    </div>:null}

    {live&&!isSeller&&auction.has_bid_access?<form action={action} className="auction-bid-form">
      <input type="hidden" name="product_id" value={productId}/>
      <input type="hidden" name="slug" value={slug}/>
      <label>Your bid
        <div className="auction-amount-input"><span>RM</span><input name="amount" required inputMode="decimal" pattern="\d{1,10}(\.\d{1,2})?" defaultValue={Number(auction.next_minimum_bid).toFixed(2)}/></div>
      </label>
      <small>Minimum next bid: {money(auction.next_minimum_bid)} · Increase: {money(auction.min_increment)}</small>
      <button className="button" disabled={pending}>{pending?'Placing bid…':'Place bid'}</button>
      {state.error?<p className="form-notice error" role="alert">{state.error}</p>:null}
      {state.success?<p className="form-notice" role="status">{state.success}</p>:null}
    </form>:null}

    {live&&isSeller?<p className="auction-seller-note">This is your auction. Sellers cannot bid on their own listings.</p>:null}
    {auction.status==='pending'||auction.status==='upcoming'?<p className="auction-seller-note">Bidding has not started yet.</p>:null}
  </section>;
}
