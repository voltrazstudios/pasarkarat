import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Archive, RotateCw } from 'lucide-react';
import { archiveEntries } from '@/data/archive';
import { billplzConfigured } from '@/lib/billplz';
import { configured, db } from '@/lib/supabase';
import { serviceConfigured } from '@/lib/supabase-service';
import { startArchiveAdCheckout, submitArchiveAd } from './actions';

export const metadata={title:'Archive Ads'};
export const dynamic='force-dynamic';

type ProductRow={
  id:string;
  name:string;
  slug:string;
  public_image_path:string|null;
};

type MyArchiveAd={
  id:string;
  archive_slug:string;
  status:'pending'|'approved'|'rejected';
  rejection_reason:string|null;
  submitted_at:string;
  product_id:string;
  product_name:string;
  product_slug:string;
  public_image_path:string|null;
  active_slots:number|string;
  active_until:string|null;
};

function dateTime(value:string|null){
  if(!value)return '';
  const date=new Date(value);
  return Number.isNaN(date.getTime())?'':date.toLocaleString('en-MY');
}

export default async function ArchiveAdsPage({searchParams}:{searchParams:Promise<{submitted?:string;payment?:string;error?:string;status?:string}>}){
  if(!configured())redirect('/auth?next=/archive-ads');

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth?next=/archive-ads');

  const query=await searchParams;
  const [productsResult,adsResult]=await Promise.all([
    client.from('marketplace_products')
      .select('id,name,slug,public_image_path')
      .eq('submitted_by',user.id)
      .eq('status','approved')
      .order('approved_at',{ascending:false}),
    client.rpc('marketplace_my_archive_ads'),
  ]);

  const products=(productsResult.data||[]) as ProductRow[];
  const rows=(Array.isArray(adsResult.data)?adsResult.data:[]) as MyArchiveAd[];
  const ads=rows.map(ad=>({
    ...ad,
    image:ad.public_image_path
      ? client.storage.from('product-images').getPublicUrl(ad.public_image_path).data.publicUrl
      : null,
    archive:archiveEntries.find(entry=>entry.slug===ad.archive_slug)||null,
  }));

  const paymentReady=billplzConfigured()&&serviceConfigured();

  const errorMessage=query.error==='product'?'Choose one of your approved products.'
    :query.error==='archive'?'Choose a valid Archive entry.'
    :query.error==='duplicate'?'That product has already been submitted for this Archive entry.'
    :query.error==='duration'?'Choose a valid Archive Ad duration.'
    :query.error==='slots'?'Choose between 1 and 5 rotation slots.'
    :query.error==='invalid-ad'?'This Archive Ad is not available for purchase.'
    :query.error==='payment-not-configured'?'Billplz is not configured yet.'
    :query.error==='email-required'?'Your account needs an email address before checkout.'
    :query.error==='payment-database'?'The Billplz checkout was created, but the Archive Ad payment could not be registered. Run the latest migration first.'
    :query.error==='billplz'&&query.status==='401'?'Billplz rejected the Sandbox Secret Key.'
    :query.error==='billplz'&&query.status==='422'?'Billplz rejected the bill details. Check your Sandbox Collection ID and credentials.'
    :query.error?'Unable to complete that Archive Ad action. Please try again.'
    :'';

  return <main id="main" className="container archive-ads-page">
    <section className="pro-hero">
      <span className="pro-icon"><Archive size={24}/></span>
      <p className="eyebrow">ARCHIVE ADS</p>
      <h1>Promote the right product beside the right story.</h1>
      <p>Connect an approved product to a relevant Pasar Karat Archive entry. After admin approval, your sponsored product can appear only on that Archive page.</p>
      {query.submitted==='1'?<div className="form-notice">Your Archive Ad pairing has been submitted for review.</div>:null}
      {query.payment==='processing'?<div className="form-notice">Billplz is confirming your payment. Your Archive Ad activates from the secure callback.</div>:null}
      {errorMessage?<div className="form-notice error" role="alert">{errorMessage}</div>:null}
    </section>

    <section className="archive-ad-pricing" aria-label="Archive Ad prices">
      <article><strong>3 days</strong><b>RM3.90</b><span>per rotation slot</span></article>
      <article><strong>7 days</strong><b>RM6.90</b><span>per rotation slot</span></article>
      <article><strong>14 days</strong><b>RM11.90</b><span>per rotation slot · best value</span></article>
    </section>

    <section className="archive-ad-explainer">
      <RotateCw size={21}/>
      <div>
        <strong>Relevant and weighted</strong>
        <p>If several sellers promote products on the same Archive entry, their sponsored products rotate. Extra active slots give that product more turns without pinning it permanently.</p>
      </div>
    </section>

    <section className="archive-ad-submit-section">
      <div className="section-heading"><div><p className="eyebrow">STEP 1</p><h2>Submit a product + Archive match</h2></div></div>
      <form action={submitArchiveAd} className="market-form archive-ad-submit-form">
        <label>Approved product
          <select name="product_id" required defaultValue="" disabled={!products.length}>
            <option value="" disabled>{products.length?'Choose one of your products':'No approved products yet'}</option>
            {products.map(product=><option value={product.id} key={product.id}>{product.name}</option>)}
          </select>
        </label>
        <label>Archive entry
          <select name="archive_slug" required defaultValue="">
            <option value="" disabled>Choose the most relevant Archive entry</option>
            {archiveEntries.map(entry=><option value={entry.slug} key={entry.id}>{entry.name} · {entry.category}</option>)}
          </select>
          <small>Example: a Labu Sayong product should be matched with the Labu Sayong Archive entry.</small>
        </label>
        <div className="submission-note">
          <strong>Admin reviews the relevance before payment is enabled.</strong>
          <span>An unrelated product can be rejected even if both the product and Archive entry are valid.</span>
        </div>
        <button className="button" disabled={!products.length}>Submit Archive Ad for review</button>
      </form>
    </section>

    <section className="archive-ad-my-section">
      <div className="section-heading"><div><p className="eyebrow">STEP 2</p><h2>Your Archive Ads</h2></div></div>
      {ads.length?<div className="archive-ad-list">{ads.map(ad=>{
        const slots=Number(ad.active_slots)||0;
        return <article className="archive-ad-row" key={ad.id}>
          <div className="archive-ad-product-image">{ad.image?<img src={ad.image} alt={ad.product_name}/>:<span>Image unavailable</span>}</div>
          <div className="archive-ad-copy">
            <div className="submission-status-line">
              <span className="status-pill" data-status={ad.status}>{ad.status}</span>
              <span>{new Date(ad.submitted_at).toLocaleDateString('en-MY')}</span>
            </div>
            <h3>{ad.product_name}</h3>
            <p>Target Archive: <strong>{ad.archive?.name||ad.archive_slug}</strong></p>
            <div className="archive-ad-links">
              <Link href={'/items/'+ad.product_slug}>View product</Link>
              {ad.archive?<Link href={'/archive/'+ad.archive.slug}>View Archive page</Link>:null}
            </div>
            {ad.status==='rejected'&&ad.rejection_reason?<p className="rejection-reason"><strong>Reason:</strong> {ad.rejection_reason}</p>:null}
            {slots>0?<div className="ad-active-slots"><strong>{slots} active rotation {slots===1?'slot':'slots'}</strong><span>Latest placement ends {dateTime(ad.active_until)}</span></div>:null}

            {ad.status==='approved'?<form action={startArchiveAdCheckout} className="ad-buy-form archive-ad-buy-form">
              <input type="hidden" name="archive_ad_id" value={ad.id}/>
              <label>Duration
                <select name="duration_days" defaultValue="7">
                  <option value="3">3 days · RM3.90 / slot</option>
                  <option value="7">7 days · RM6.90 / slot</option>
                  <option value="14">14 days · RM11.90 / slot</option>
                </select>
              </label>
              <label>Rotation slots
                <select name="weight_units" defaultValue="1">
                  <option value="1">1 slot</option>
                  <option value="2">2 slots</option>
                  <option value="3">3 slots</option>
                  <option value="4">4 slots</option>
                  <option value="5">5 slots</option>
                </select>
              </label>
              <button className="button" disabled={!paymentReady}>Buy Archive Ad placement</button>
              <small>You can buy the same approved Archive Ad again. Active purchases stack together.</small>
            </form>:null}
          </div>
        </article>;
      })}</div>:<div className="empty-state"><h2>No Archive Ads yet</h2><p>Submit an approved product for a relevant Archive entry to get started.</p></div>}
    </section>
  </main>;
}
