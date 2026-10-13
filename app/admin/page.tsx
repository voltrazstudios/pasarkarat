import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { approveProduct, rejectProduct, approveProductEdit, rejectProductEdit, approveAd, rejectAd } from './actions';
import { DeleteProductButton } from './delete-product-button';
import { formatPriceRange } from '@/lib/product-price';

type AdminRow={
  id:string;
  name:string;
  description:string;
  price:number|string;
  min_price:number|string;
  max_price:number|string;
  category:string;
  listing_type:'normal'|'rare_limited';
  story_title:string|null;
  story_text:string|null;
  story_video_url:string|null;
  certificate_title:string|null;
  certificate_details:string|null;
  pending_story_image_paths:string[];
  pending_certificate_image_path:string|null;
  pending_image_path:string;
  submitted_at:string;
  auction:null|{starting_bid:number|string;min_increment:number|string;duration_minutes:number};
  submitter:{id:string;email:string|null;display_name:string|null;avatar_path:string|null;approved_products:number};
  links:{platform:string;seller_url:string;affiliate_url:string|null}[];
};

type AdminEditRow={
  id:string;
  product_id:string;
  slug:string;
  current_name:string;
  current_public_image_path:string|null;
  name:string;
  description:string;
  min_price:number|string;
  max_price:number|string;
  category:string;
  pending_image_path:string|null;
  submitted_at:string;
  submitter:{id:string;email:string|null;display_name:string|null;avatar_path:string|null};
  links:{platform:string;seller_url:string;affiliate_url:string|null}[];
};

type AdminAdRow={
  id:string;
  title:string;
  destination_url:string;
  pending_desktop_path:string;
  pending_mobile_path:string;
  submitted_at:string;
  submitter:{id:string;email:string|null;display_name:string|null};
};

type PublishedRow={
  id:string;slug:string;name:string;price:number|string;min_price:number|string;max_price:number|string;category:string;public_image_path:string|null;approved_at:string|null;
};

export default async function AdminPage({searchParams}:{searchParams:Promise<{updated?:string;error?:string}>}){
  const client=await requireAdmin();
  const params=await searchParams;

  const [pendingResult,pendingEditsResult,pendingAdsResult,publishedResult]=await Promise.all([
    client.rpc('marketplace_admin_pending'),
    client.rpc('marketplace_admin_pending_edits'),
    client.rpc('marketplace_admin_pending_ads'),
    client.from('marketplace_products')
      .select('id,slug,name,price,min_price,max_price,category,public_image_path,approved_at')
      .eq('status','approved')
      .order('approved_at',{ascending:false}),
  ]);

  if(pendingResult.error||pendingEditsResult.error||pendingAdsResult.error||publishedResult.error)throw new Error('Admin moderation data is unavailable.');

  const rows=(pendingResult.data||[]) as AdminRow[];
  const reviews=await Promise.all(rows.map(async row=>{
    const signed=await client.storage.from('product-submission-images').createSignedUrl(row.pending_image_path,60*30);
    const storyImages=(await Promise.all((row.pending_story_image_paths||[]).map(async path=>{
      const result=await client.storage.from('product-submission-images').createSignedUrl(path,60*30);
      return result.data?.signedUrl||null;
    }))).filter((value):value is string=>Boolean(value));
    const certificateImage=row.pending_certificate_image_path
      ? (await client.storage.from('product-submission-images').createSignedUrl(row.pending_certificate_image_path,60*30)).data?.signedUrl||null
      : null;
    const avatar=row.submitter.avatar_path
      ? client.storage.from('marketplace-profile-images').getPublicUrl(row.submitter.avatar_path).data.publicUrl
      : null;
    return {...row,image:signed.data?.signedUrl||null,storyImages,certificateImage,submitter:{...row.submitter,avatar}};
  }));

  const editRows=(pendingEditsResult.data||[]) as AdminEditRow[];
  const editReviews=await Promise.all(editRows.map(async row=>{
    let image:string|null=null;
    if(row.pending_image_path){
      const signed=await client.storage.from('product-submission-images').createSignedUrl(row.pending_image_path,60*30);
      image=signed.data?.signedUrl||null;
    }else if(row.current_public_image_path){
      image=client.storage.from('product-images').getPublicUrl(row.current_public_image_path).data.publicUrl;
    }

    const avatar=row.submitter.avatar_path
      ? client.storage.from('marketplace-profile-images').getPublicUrl(row.submitter.avatar_path).data.publicUrl
      : null;

    return {...row,image,submitter:{...row.submitter,avatar}};
  }));

  const adRows=(pendingAdsResult.data||[]) as AdminAdRow[];
  const adReviews=await Promise.all(adRows.map(async row=>{
    const [desktop,mobile]=await Promise.all([
      client.storage.from('marketplace-ad-submissions').createSignedUrl(row.pending_desktop_path,60*30),
      client.storage.from('marketplace-ad-submissions').createSignedUrl(row.pending_mobile_path,60*30),
    ]);
    return {
      ...row,
      desktop:desktop.data?.signedUrl||null,
      mobile:mobile.data?.signedUrl||null,
    };
  }));

  const published=((publishedResult.data||[]) as PublishedRow[]).map(row=>({
    ...row,
    image:row.public_image_path?client.storage.from('product-images').getPublicUrl(row.public_image_path).data.publicUrl:null,
  }));

  return <main id="main" className="container moderation-page">
    <div className="submission-heading">
      <div>
        <p className="eyebrow">PRIVATE MODERATION</p>
        <h1>Marketplace moderation</h1>
        <p className="intro">Review banner ads, new products, seller edits and community products already published in the Collection.</p>
      </div>
      <span className="pending-count">{reviews.length+editReviews.length+adReviews.length} pending</span>
    </div>

    {params.updated&&<div className="form-notice" role="status">Moderation update: {params.updated}.</div>}
    {params.error&&<div className="form-notice error" role="alert">{params.error}</div>}

    <section className="admin-product-section admin-ad-section">
      <div className="admin-section-heading">
        <div><p className="eyebrow">SPONSORED PLACEMENTS</p><h2>Pending banner ads</h2></div>
        <span>{adReviews.length} pending</span>
      </div>
      {adReviews.length?<div className="admin-ad-list">{adReviews.map(ad=><article className="admin-ad-card" key={ad.id}>
        <div className="admin-ad-previews">
          <div><span>Desktop</span>{ad.desktop?<img src={ad.desktop} alt={ad.title+' desktop banner'}/>:<em>Unavailable</em>}</div>
          <div className="admin-ad-mobile-preview"><span>Mobile</span>{ad.mobile?<img src={ad.mobile} alt={ad.title+' mobile banner'}/>:<em>Unavailable</em>}</div>
        </div>
        <div className="admin-ad-copy">
          <div className="submission-status-line"><span>Banner advertisement</span><span>{new Date(ad.submitted_at).toLocaleString('en-MY')}</span></div>
          <h3>{ad.title}</h3>
          <a href={ad.destination_url} target="_blank" rel="noopener noreferrer nofollow">{ad.destination_url}</a>
          <div className="submitter-box">
            <strong>Advertiser</strong>
            <span>{ad.submitter.display_name||'Marketplace member'}</span>
            <span>{ad.submitter.email||ad.submitter.id}</span>
          </div>
          <form className="moderation-actions">
            <input type="hidden" name="ad_id" value={ad.id}/>
            <label>Rejection reason<textarea name="reason" maxLength={500} rows={3} placeholder="Required only when rejecting"/></label>
            <div><button className="button approve-button" formAction={approveAd}>Approve ad</button><button className="button secondary reject-button" formAction={rejectAd}>Reject ad</button></div>
          </form>
        </div>
      </article>)}</div>:<div className="empty-state"><h2>No ads waiting for review</h2><p>New banner submissions will appear here.</p></div>}
    </section>

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
          {row.listing_type==='rare_limited'?<div className="admin-rare-review">
            <span className="rare-limited-badge">Rare &amp; Limited</span>
            <h3>{row.story_title}</h3>
            <p className="admin-rare-story">{row.story_text}</p>
            {row.storyImages.length?<div className="admin-story-images">{row.storyImages.map((src,index)=><img src={src} alt={`Story image ${index+1}`} key={src}/>)}</div>:null}
            {row.story_video_url?<a className="text-link" href={row.story_video_url} target="_blank" rel="noopener noreferrer nofollow">Review story video</a>:null}
            {(row.certificate_title||row.certificate_details||row.certificateImage)?<div className="admin-certificate-review">
              <strong>{row.certificate_title||'Certificate / provenance'}</strong>
              {row.certificate_details?<p>{row.certificate_details}</p>:null}
              {row.certificateImage?<img src={row.certificateImage} alt="Certificate or provenance"/>:null}
            </div>:null}
            {row.auction?<div className="admin-auction-review">
              <strong>Auction enabled</strong>
              <span>Starting bid: RM {Number(row.auction.starting_bid).toFixed(2)}</span>
              <span>Minimum increase: RM {Number(row.auction.min_increment).toFixed(2)}</span>
              <span>Duration: {Math.round(row.auction.duration_minutes/60)} hour(s) after approval</span>
            </div>:null}
          </div>:null}
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
              ? <Link href={'/seller/'+row.submitter.id} className="button secondary admin-view-store">View Store</Link>
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

    <section className="admin-product-section">
      <div className="admin-section-heading">
        <div><p className="eyebrow">LIVE PRODUCT CHANGES</p><h2>Pending product edits</h2></div>
        <span>{editReviews.length} pending</span>
      </div>

      {editReviews.length?<div className="moderation-list">{editReviews.map(row=><article className="moderation-card" key={row.id}>
        <div className="moderation-image">{row.image?<img src={row.image} alt={row.name}/>:<span>Image unavailable</span>}</div>
        <div className="moderation-content">
          <div className="submission-status-line">
            <span className="admin-edit-request-label">EDIT REQUEST</span>
            <span>{new Date(row.submitted_at).toLocaleString('en-MY')}</span>
          </div>
          <p className="admin-edit-current">Current live product: <Link href={'/items/'+row.slug}>{row.current_name}</Link></p>
          <h2>{row.name}</h2>
          <strong className="moderation-price">{formatPriceRange(Number(row.min_price),Number(row.max_price))}</strong>
          <p className="moderation-description">{row.description}</p>

          <div className="submitter-box admin-submitter-box">
            <div className="admin-submitter-avatar">
              {row.submitter.avatar?<img src={row.submitter.avatar} alt=""/>:<span>{(row.submitter.display_name||'M').slice(0,1).toUpperCase()}</span>}
            </div>
            <div className="admin-submitter-copy">
              <strong>Seller</strong>
              <span>{row.submitter.display_name||'Marketplace member'}</span>
              <span>{row.submitter.email||row.submitter.id}</span>
            </div>
            <Link href={'/seller/'+row.submitter.id} className="button secondary admin-view-store">View Store</Link>
          </div>

          <div className="admin-links"><strong>Updated seller links</strong>{row.links.map(link=><div key={link.platform}><span>{link.platform}</span><a href={link.seller_url} target="_blank" rel="noopener noreferrer nofollow">{link.seller_url}</a>{link.affiliate_url&&<a href={link.affiliate_url} target="_blank" rel="noopener noreferrer sponsored">Affiliate: {link.affiliate_url}</a>}</div>)}</div>

          <form className="moderation-actions">
            <input type="hidden" name="edit_id" value={row.id}/>
            <label>Rejection reason<textarea name="reason" maxLength={500} rows={3} placeholder="Required only when rejecting"/></label>
            <div><button className="button approve-button" formAction={approveProductEdit}>Approve edit</button><button className="button secondary reject-button" formAction={rejectProductEdit}>Reject edit</button></div>
          </form>
        </div>
      </article>)}</div>:<div className="empty-state"><h2>No edits waiting for review</h2><p>Changes to approved seller products will appear here.</p></div>}
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
          <Link href={'/items/'+row.slug} className="text-link">View product</Link>
        </div>
        <DeleteProductButton id={row.id} name={row.name}/>
      </article>)}</div>:<div className="empty-state"><h2>No community products published yet</h2><p>Approved submissions will appear here for admin management.</p></div>}
      <p className="admin-delete-note">Only community-submitted products appear here. The original built-in Pasar Karat catalogue is protected.</p>
    </section>
  </main>;
}
