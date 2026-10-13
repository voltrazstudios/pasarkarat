import { redirect } from 'next/navigation';
import { Megaphone, Monitor, Smartphone, RotateCw } from 'lucide-react';
import { billplzConfigured } from '@/lib/billplz';
import { configured, db } from '@/lib/supabase';
import { serviceConfigured } from '@/lib/supabase-service';
import { startAdCheckout, submitAd } from './actions';

export const metadata={title:'Advertise on Pasar Karat'};
export const dynamic='force-dynamic';

type MyAd={
  id:string;
  title:string;
  destination_url:string;
  status:'pending'|'approved'|'rejected';
  rejection_reason:string|null;
  submitted_at:string;
  pending_desktop_path:string;
  pending_mobile_path:string;
  public_desktop_path:string|null;
  public_mobile_path:string|null;
  active_slots:number|string;
  active_until:string|null;
};

function dateTime(value:string|null){
  if(!value)return '';
  const date=new Date(value);
  return Number.isNaN(date.getTime())?'':date.toLocaleString('en-MY');
}

export default async function AdvertisePage({searchParams}:{searchParams:Promise<{submitted?:string;payment?:string;error?:string;status?:string}>}){
  if(!configured())redirect('/auth?next=/advertise');

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth?next=/advertise');

  const query=await searchParams;
  const adsResult=await client.rpc('marketplace_my_ads');
  const rows=(Array.isArray(adsResult.data)?adsResult.data:[]) as MyAd[];
  const ads=await Promise.all(rows.map(async ad=>{
    let desktop:string|null=null;
    let mobile:string|null=null;

    if(ad.status==='approved'&&ad.public_desktop_path&&ad.public_mobile_path){
      desktop=client.storage.from('marketplace-ad-images').getPublicUrl(ad.public_desktop_path).data.publicUrl;
      mobile=client.storage.from('marketplace-ad-images').getPublicUrl(ad.public_mobile_path).data.publicUrl;
    }else{
      const [desktopSigned,mobileSigned]=await Promise.all([
        client.storage.from('marketplace-ad-submissions').createSignedUrl(ad.pending_desktop_path,60*30),
        client.storage.from('marketplace-ad-submissions').createSignedUrl(ad.pending_mobile_path,60*30),
      ]);
      desktop=desktopSigned.data?.signedUrl||null;
      mobile=mobileSigned.data?.signedUrl||null;
    }

    return {...ad,desktop,mobile};
  }));

  const paymentReady=billplzConfigured()&&serviceConfigured();

  const errorMessage=query.error==='title'?'Ad title must be between 3 and 100 characters.'
    :query.error==='url'?'Use a valid HTTPS destination URL.'
    :query.error==='desktop-image'?'Upload a desktop banner image.'
    :query.error==='mobile-image'?'Upload a mobile banner image.'
    :query.error==='duration'?'Choose a valid advertising duration.'
    :query.error==='slots'?'Choose between 1 and 5 rotation slots.'
    :query.error==='invalid-ad'?'This ad is not available for purchase.'
    :query.error==='payment-not-configured'?'Billplz is not configured yet.'
    :query.error==='email-required'?'Your account needs an email address before checkout.'
    :query.error==='payment-database'?'The Billplz checkout was created, but the ad payment could not be registered. Run the latest migration first.'
    :query.error==='billplz'&&query.status==='401'?'Billplz rejected the Sandbox Secret Key.'
    :query.error==='billplz'&&query.status==='422'?'Billplz rejected the bill details. Check your Sandbox Collection ID and credentials.'
    :query.error?'Unable to complete that advertising action. Please try again.'
    :'';

  return <main id="main" className="container advertise-page">
    <section className="pro-hero advertise-hero">
      <span className="pro-icon"><Megaphone size={24}/></span>
      <p className="eyebrow">BANNER ADVERTISING</p>
      <h1>Put your banner in front of Pasar Karat visitors.</h1>
      <p>Submit your creative for review first. Once approved, buy one or more rotation slots. More active slots mean your banner appears more often.</p>
      {query.submitted==='1'?<div className="form-notice">Your banner has been submitted for review. Payment becomes available after approval.</div>:null}
      {query.payment==='processing'?<div className="form-notice">Billplz is confirming your payment. Your rotation slots activate from the secure callback.</div>:null}
      {errorMessage?<div className="form-notice error" role="alert">{errorMessage}</div>:null}
    </section>

    <section className="ad-pricing-grid" aria-label="Banner advertising prices">
      <article><strong>3 days</strong><b>RM6.90</b><span>per rotation slot</span></article>
      <article><strong>7 days</strong><b>RM12.90</b><span>per rotation slot</span></article>
      <article><strong>14 days</strong><b>RM21.90</b><span>per rotation slot · best value</span></article>
    </section>

    <section className="advertise-explainer">
      <div><RotateCw size={22}/><strong>Weighted rotation</strong><p>1 slot gets one share of the rotation. Buy 3 slots and the same approved banner receives roughly 3× the turns while those slots are active.</p></div>
      <div><Monitor size={22}/><strong>Desktop banner</strong><p>Recommended artwork: 1800 × 600 px. It is displayed in a wide 3:1 banner.</p></div>
      <div><Smartphone size={22}/><strong>Mobile banner</strong><p>Recommended artwork: 1200 × 900 px. Mobile visitors get this dedicated version instead of a cropped desktop ad.</p></div>
    </section>

    <section className="advertise-submit-section">
      <div className="section-heading"><div><p className="eyebrow">STEP 1</p><h2>Submit a banner for review</h2></div></div>
      <form action={submitAd} className="market-form advertise-form">
        <label>Ad title
          <input name="title" required minLength={3} maxLength={100} placeholder="e.g. ABC Antiques Weekend Sale"/>
        </label>
        <label>Destination URL
          <input name="destination_url" required type="url" placeholder="https://example.com/your-page"/>
          <small>The whole banner opens this HTTPS link in a new tab.</small>
        </label>
        <div className="ad-image-inputs">
          <label>Desktop banner
            <input name="desktop_image" type="file" required accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"/>
            <small>Recommended 1800 × 600 px · maximum 5 MB.</small>
          </label>
          <label>Mobile banner
            <input name="mobile_image" type="file" required accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"/>
            <small>Recommended 1200 × 900 px · maximum 5 MB.</small>
          </label>
        </div>
        <div className="submission-note">
          <strong>Ads are reviewed before they can be purchased.</strong>
          <span>Pasar Karat may reject misleading, unsafe, inappropriate or low-quality advertisements.</span>
        </div>
        <button className="button submit-product-button">Submit banner for review</button>
      </form>
    </section>

    <section className="advertise-my-ads">
      <div className="section-heading"><div><p className="eyebrow">STEP 2</p><h2>Your banner ads</h2></div></div>

      {ads.length?<div className="my-ad-list">{ads.map(ad=>{
        const activeSlots=Number(ad.active_slots)||0;
        return <article className="my-ad-card" key={ad.id}>
          <div className="my-ad-preview">
            {ad.desktop?<img src={ad.desktop} alt={ad.title}/>:<span>Desktop preview unavailable</span>}
          </div>
          <div className="my-ad-copy">
            <div className="submission-status-line">
              <span className="status-pill" data-status={ad.status}>{ad.status}</span>
              <span>{new Date(ad.submitted_at).toLocaleDateString('en-MY')}</span>
            </div>
            <h3>{ad.title}</h3>
            <a href={ad.destination_url} target="_blank" rel="noopener noreferrer nofollow">{ad.destination_url}</a>
            {ad.status==='rejected'&&ad.rejection_reason?<p className="rejection-reason"><strong>Reason:</strong> {ad.rejection_reason}</p>:null}
            {activeSlots>0?<div className="ad-active-slots"><strong>{activeSlots} active rotation {activeSlots===1?'slot':'slots'}</strong><span>Latest placement ends {dateTime(ad.active_until)}</span></div>:null}

            {ad.status==='approved'?<form action={startAdCheckout} className="ad-buy-form">
              <input type="hidden" name="ad_id" value={ad.id}/>
              <label>Duration
                <select name="duration_days" defaultValue="7">
                  <option value="3">3 days · RM6.90 / slot</option>
                  <option value="7">7 days · RM12.90 / slot</option>
                  <option value="14">14 days · RM21.90 / slot</option>
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
              <button className="button" disabled={!paymentReady}>Buy ad placement</button>
              <small>You can purchase this same ad again later. Active purchases stack together.</small>
            </form>:null}
          </div>
        </article>;
      })}</div>:<div className="empty-state"><h2>No banner ads yet</h2><p>Your submitted advertisements will appear here.</p></div>}
    </section>
  </main>;
}
