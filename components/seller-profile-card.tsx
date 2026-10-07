import Link from 'next/link';
import { Star, Store, UserRound, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SellerSummary } from '@/lib/sellers';

function joinedLabel(value:string){
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return '—';
  return new Intl.DateTimeFormat('en-MY',{day:'numeric',month:'short',year:'numeric'}).format(date);
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
        <div className="seller-profile-actions">{actions??(
          <Link href={`/seller/${seller.id}`} className="seller-store-link">View Store</Link>
        )}</div>
      </div>
      <div className="seller-stats-inline">
        <span className="seller-stat-item"><Star className="seller-stat-icon" size={18} strokeWidth={1.9} aria-hidden="true"/><strong>Ratings:</strong> <b>{seller.ratings}</b></span>
        <span className="seller-stat-item"><Store className="seller-stat-icon" size={18} strokeWidth={1.9} aria-hidden="true"/><strong>Products:</strong> <b>{seller.products}</b></span>
        <span className="seller-stat-item"><UsersRound className="seller-stat-icon" size={18} strokeWidth={1.9} aria-hidden="true"/><strong>Follower:</strong> <b>{seller.followers}</b></span>
        <span className="seller-stat-item"><UserRound className="seller-stat-icon" size={18} strokeWidth={1.9} aria-hidden="true"/><strong>Joined:</strong> <b>{joinedLabel(seller.joinedAt)}</b></span>
      </div>
    </div>
  </section>;
}
