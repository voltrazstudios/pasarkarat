import Link from 'next/link';
import { UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SellerSummary } from '@/lib/sellers';

function joinedLabel(value:string){
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return '—';
  return new Intl.DateTimeFormat('en-MY',{month:'short',year:'numeric'}).format(date);
}

export function SellerProfileCard({seller,actions}:{seller:SellerSummary;actions?:ReactNode}){
  return <section className="seller-profile-card" aria-label={`Seller: ${seller.storeName}`}>
    <div className="seller-profile-identity">
      <Link className="seller-profile-avatar" href={`/seller/${seller.id}`} aria-label={`View ${seller.storeName} store`}>
        {seller.avatarUrl?<img src={seller.avatarUrl} alt=""/>:<UserRound size={32} strokeWidth={1.7} aria-hidden="true"/>}
      </Link>
      <div className="seller-profile-name">
        <Link href={`/seller/${seller.id}`}>{seller.storeName}</Link>
        <small className="seller-profile-description">{seller.description||'Pasar Karat seller'}</small>
        <div className="seller-profile-actions">{actions??<Link href={`/seller/${seller.id}`} className="seller-store-link">View Store</Link>}</div>
      </div>
    </div>
    <div className="seller-stat"><span>Ratings</span><strong title="Total saves across this seller's products">{seller.ratings}</strong></div>
    <div className="seller-stat"><span>Products</span><strong>{seller.products}</strong></div>
    <div className="seller-stat"><span>Follower</span><strong>{seller.followers}</strong></div>
    <div className="seller-stat"><span>Joined</span><strong>{joinedLabel(seller.joinedAt)}</strong></div>
  </section>;
}
