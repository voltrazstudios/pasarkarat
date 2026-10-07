import Link from 'next/link';
import { UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SellerSummary } from '@/lib/sellers';

function joinedLabel(value:string){
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return '—';
  return new Intl.DateTimeFormat('en-MY',{day:'numeric',month:'short',year:'numeric'}).format(date);
}

export function SellerProfileCard({seller,actions}:{seller:SellerSummary;actions?:ReactNode}){
  const actionContent=actions??(
    seller.isOwner
      ? <>
          <Link href={`/seller/${seller.id}?customize=1#customize-store`} className="seller-store-link seller-store-link-primary">Customize Store</Link>
          <Link href="/my-submissions" prefetch={false} className="seller-store-link">My Submission</Link>
        </>
      : <Link href={`/seller/${seller.id}`} className="seller-store-link seller-store-link-primary">View Store</Link>
  );

  return <section className="seller-profile-card seller-profile-card-clean" aria-label={`Seller: ${seller.storeName}`}>
    <div className="seller-profile-clean-top">
      <Link className="seller-profile-avatar" href={`/seller/${seller.id}`} aria-label={`View ${seller.storeName} store`}>
        {seller.avatarUrl?<img src={seller.avatarUrl} alt=""/>:<UserRound size={32} strokeWidth={1.7} aria-hidden="true"/>}
      </Link>

      <div className="seller-profile-clean-copy">
        <Link className="seller-profile-clean-name" href={`/seller/${seller.id}`}>{seller.storeName}</Link>
        <p className="seller-profile-description">{seller.description||'Pasar Karat seller'}</p>
      </div>

      <div className="seller-profile-actions seller-profile-clean-actions">
        {actionContent}
      </div>
    </div>

    <div className="seller-stats-inline seller-stats-clean">
      <span><strong>Ratings</strong><b>{seller.ratings}</b></span>
      <span><strong>Products</strong><b>{seller.products}</b></span>
      <span><strong>Follower</strong><b>{seller.followers}</b></span>
      <span><strong>Joined</strong><b>{joinedLabel(seller.joinedAt)}</b></span>
    </div>
  </section>;
}
