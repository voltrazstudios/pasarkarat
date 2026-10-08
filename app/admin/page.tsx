import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { approveProduct, rejectProduct } from './actions';
import { DeleteProductButton } from './delete-product-button';
import { formatPriceRange } from '@/lib/product-price';

type AdminRow={
  id:string;name:string;description:string;price:number|string;min_price:number|string;max_price:number|string;category:string;pending_image_path:string;submitted_at:string;
  submitter:{id:string;email:string|null;display_name:string|null;avatar_path:string|null;approved_products:number};
  links:{platform:string;seller_url:string;affiliate_url:string|null}[];
};

type PublishedRow={
  id:string;slug:string;name:string;price:number|string;min_price:number|string;max_price:number|string;category:string;public_image_path:string|null;approved_at:string|null;
};

export default async function AdminPage({searchParams}:{searchParams:Promise<{updated?:string;error?:string}>}){
  const client=await requireAdmin();
  const params=await searchParams;

  const [pendingResult,publishedResult]=await Promise.all([
    client.rpc('marketplace_admin_pending'),
    client.from('marketplace_products')
      .select('id,slug,name,price,min_price,max_price,category,public_image_path,approved_at')
      .eq('status','approved')
      .order('approved_at',{ascending:false}),
  ]);

  if(pendingResult.error||publishedResult.error)throw new Error('Admin products are unavailable.');

  const rows=(pendingResult.data||[]) as AdminRow[];
  const reviews=await Promise.all(rows.map(async row=>{
    const signed=await client.storage.from('product-submission-images').createSignedUrl(row.pending_image_path,60*30);
    const avatar=row.submitter.avatar_path
      ? client.storage.from('marketplace-profile-images').getPublicUrl(row.submitter.avatar_path).data.publicUrl
      : null;
    return {...row,image:signed.data?.signedUrl||null,submitter:{...row.submitter,avatar}};
  }));

  const published=((publishedResult.data||[]) as PublishedRow[]).map(row=>({
    ...row,
    image:row.public_image_path?client.storage.from('product-images').getPublicUrl(row.public_image_path).data.publicUrl:null,
  }));

  return <main id="main" className="container moderation-page">
    <div className="submission-heading">
      <div>
        <p className="eyebrow">PRIVATE MODERATION</p>
        <h1>Product submissions</h1>
        <p className="intro">Review new products and manage community products already published in the Collection.</p>
      </div>
      <span className="pending-count">{reviews.length} pending</span>
    </div>

    {params.updated&&<div className="form-notice" role="status">Product {params.updated}.</div>}
    {params.error&&<div className="form-notice error" role="alert">{params.error}</div>}

    <section className="admin-product-section">
      <div className="admin-section-heading">
        <div><p className="eyebrow">WAITING FOR REVIEW</p><h2>Pending submissions</h2></div>
      </div>
      {reviews.length?<div className="moderation-list">{reviews.map(row=><article className="moderation-card" key={row.id}>
        <div className="moderation-image">{row.image?<img src={row.image} alt={row.name}/>:<span>Image unavailable</span>}</div>
        <div className="moderation-content">
          <div className="submission-status-line"><span>{row.category}</span><span>{new Date(row.submitted_at).toLocaleString('en-MY')}</span></div>
          <h2>{row.name}</h2>
          <strong className="moderation-price">{formatPriceRange(Number(row.min_price??row.price),Number(row.max_price??row.min_price??row.price))}</strong>
          <p className="moderation-description">{row.description}</p>
          <div className="submitter-box admin-submitter-box">
            <div className="admin-submitter-avatar">
              {row.submitter.avatar?<img src={row.submitter.avatar} alt=""/>:<span>{(row.submitter.display_name||'M').slice(0,1).toUpperCase()}</span>}
            </div>
            <div className="admin-submitter-copy">
              <strong>Submitter</strong>
              <span>{row.submitter.display_name||'Marketplace member'}</span>
              <span>{row.submitter.email||row.submitter.id}</span>
            </div>
            {row.submitter.approved_products>0
              ? <Link href={`/seller/${row.submitter.id}`} className="button secondary admin-view-store">View Store</Link>
              : <span className="admin-store-not-live">Store not live yet</span>}
          </div>
          <div className="admin-links"><strong>Seller links</strong>{row.links.map(link=><div key={link.platform}><span>{link.platform}</span><a href={link.seller_url} target="_blank" rel="noopener noreferrer nofollow">{link.seller_url}</a>{link.affiliate_url&&<a href={link.affiliate_url} target="_blank" rel="noopener noreferrer sponsored">Affiliate: {link.affiliate_url}</a>}</div>)}</div>
          <form className="moderation-actions">
            <input type="hidden" name="id" value={row.id}/>
            <label>Rejection reason<textarea name="reason" maxLength={500} rows={3} placeholder="Required only when rejecting"/></label>
            <div><button className="button approve-button" formAction={approveProduct}>Approve</button><button className="button secondary reject-button" formAction={rejectProduct}>Reject</button></div>
          </form>
        </div>
      </article>)}</div>:<div className="empty-state"><h2>Nothing waiting for review</h2><p>New product submissions will appear here.</p></div>}
    </section>

    <section className="admin-product-section published-products-section">
      <div className="admin-section-heading">
        <div><p className="eyebrow">LIVE IN COLLECTION</p><h2>Published community products</h2></div>
        <span>{published.length} published</span>
      </div>

      {published.length?<div className="published-product-list">{published.map(row=><article className="published-product-row" key={row.id}>
        <div className="published-product-image">{row.image?<img src={row.image} alt={row.name}/>:<span>Image unavailable</span>}</div>
        <div className="published-product-copy">
          <div className="submission-status-line"><span>{row.category}</span><span>{row.approved_at?new Date(row.approved_at).toLocaleDateString('en-MY'):''}</span></div>
          <h3>{row.name}</h3>
          <p>{formatPriceRange(Number(row.min_price??row.price),Number(row.max_price??row.min_price??row.price))}</p>
          <Link href={`/items/${row.slug}`} className="text-link">View product</Link>
        </div>
        <DeleteProductButton id={row.id} name={row.name}/>
      </article>)}</div>:<div className="empty-state"><h2>No community products published yet</h2><p>Approved submissions will appear here for admin management.</p></div>}
      <p className="admin-delete-note">Only community-submitted products appear here. The original built-in Pasar Karat catalogue is protected.</p>
    </section>
  </main>;
}
