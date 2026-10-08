import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Megaphone, Package, Store } from 'lucide-react';
import { billplzConfigured } from '@/lib/billplz';
import { configured, db } from '@/lib/supabase';
import { serviceConfigured } from '@/lib/supabase-service';
import { startPromotionCheckout } from './actions';

export const metadata={title:'Promote your store'};
export const dynamic='force-dynamic';

type ProductRow={id:string;name:string;boosted_until:string|null};

function dateLabel(value:string|null){
  if(!value)return '';
  const date=new Date(value);
  return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('en-MY',{day:'numeric',month:'short',year:'numeric'}).format(date);
}

export default async function PromotePage({searchParams}:{searchParams:Promise<{error?:string;payment?:string;status?:string}>}){
  if(!configured())redirect('/auth?next=/promote');

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth?next=/promote');

  const query=await searchParams;
  const [productsResult,profileResult]=await Promise.all([
    client.from('marketplace_products')
      .select('id,name,boosted_until')
      .eq('submitted_by',user.id)
      .eq('status','approved')
      .order('approved_at',{ascending:false}),
    client.from('marketplace_profiles')
      .select('featured_until')
      .eq('id',user.id)
      .maybeSingle(),
  ]);

  const products=(productsResult.data||[]) as ProductRow[];
  const featuredUntil=typeof profileResult.data?.featured_until==='string'?profileResult.data.featured_until:null;
  const now=Date.now();
  const featuredActive=Boolean(featuredUntil&&new Date(featuredUntil).getTime()>now);
  const paymentReady=billplzConfigured()&&serviceConfigured();

  const errorMessage=query.error==='payment-not-configured'
    ? 'Billplz Sandbox is not configured yet.'
    : query.error==='email-required'
      ? 'Your account needs an email address before checkout can start.'
      : query.error==='choose-product'
        ? 'Choose one of your approved products to boost.'
        : query.error==='no-approved-products'
          ? 'You need at least one approved product before featuring your store.'
          : query.error==='payment-database'
            ? 'Billplz created the checkout, but Pasar Karat could not register the promotion payment. Run the latest Supabase migration first.'
            : query.error==='billplz'&&query.status==='401'
              ? 'Billplz rejected the Sandbox Secret Key.'
              : query.error==='billplz'&&query.status==='422'
                ? 'Billplz rejected the bill details. Check the Collection ID and Sandbox credentials.'
                : query.error
                  ? 'Unable to start the promotion payment. Please try again.'
                  : '';

  return <main id="main" className="container pro-page promotion-page">
    <section className="pro-hero">
      <span className="pro-icon"><Megaphone size={24}/></span>
      <p className="eyebrow">SELLER PROMOTION</p>
      <h1>Put your products in front of more people.</h1>
      <p>Pay only when you want extra visibility. Promotions are separate from Pasar Karat Pro and use Billplz checkout.</p>
      {query.payment==='processing'?<div className="form-notice">Your Billplz payment is being confirmed. The promotion activates from the secure server callback.</div>:null}
      {errorMessage?<div className="form-notice error" role="alert">{errorMessage}</div>:null}
    </section>

    <section className="promotion-plans" aria-label="Seller promotion options">
      <article className="promotion-card">
        <span className="promotion-card-icon"><Package size={22}/></span>
        <p className="pro-plan-kicker">02 — PRODUCT BOOSTING</p>
        <h2>RM0.90</h2>
        <p>Boost one approved product for 7 days. Active boosts are prioritised in collection and search results.</p>
        <form action={startPromotionCheckout} className="promotion-form">
          <input type="hidden" name="promotion_type" value="product_boost"/>
          <label>
            Choose product
            <select name="product_id" defaultValue="" required disabled={!products.length}>
              <option value="" disabled>{products.length?'Select an approved product':'No approved products yet'}</option>
              {products.map(product=>{
                const active=Boolean(product.boosted_until&&new Date(product.boosted_until).getTime()>now);
                return <option value={product.id} key={product.id}>{product.name}{active?' · Boosted until '+dateLabel(product.boosted_until):''}</option>;
              })}
            </select>
          </label>
          <button className="button" disabled={!paymentReady||!products.length}>Boost for RM0.90</button>
        </form>
      </article>

      <article className="promotion-card promotion-card-featured">
        <span className="promotion-card-icon"><Store size={22}/></span>
        <p className="pro-plan-kicker">03 — FEATURED STORE PLACEMENT</p>
        <h2>RM3.90</h2>
        <p>Feature your storefront on the Pasar Karat homepage for 7 days.</p>
        {featuredActive?<div className="promotion-active">Currently featured until {dateLabel(featuredUntil)}</div>:null}
        <form action={startPromotionCheckout} className="promotion-form">
          <input type="hidden" name="promotion_type" value="featured_store"/>
          <button className="button" disabled={!paymentReady||!products.length}>Feature Store for RM3.90</button>
        </form>
      </article>
    </section>

    {!products.length?<p className="pro-config-note">Submit a product and wait for approval before purchasing a promotion. <Link href="/submit-product" className="text-link">Submit Product</Link></p>:null}
    {!paymentReady?<p className="pro-config-note">Billplz checkout is disabled until the existing Sandbox credentials and public callback URL are configured.</p>:null}

    <div className="promotion-back"><Link href="/my-store" className="button secondary">Back to My Store</Link></div>
  </main>;
}
