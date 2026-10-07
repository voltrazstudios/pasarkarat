import Link from 'next/link';
import { Check, Crown } from 'lucide-react';
import { billplzConfigured } from '@/lib/billplz';
import { configured, db } from '@/lib/supabase';
import { serviceConfigured } from '@/lib/supabase-service';
import { startProCheckout } from './actions';

export const metadata={title:'Pasar Karat Pro'};
export const dynamic='force-dynamic';

function dateLabel(value:string){
  const date=new Date(value);
  return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('en-MY',{day:'numeric',month:'short',year:'numeric'}).format(date);
}

export default async function ProPage({searchParams}:{searchParams:Promise<{error?:string;payment?:string}>}){
  const query=await searchParams;
  let user:null|{id:string;email?:string}=null;
  let proUntil:string|null=null;

  if(configured()){
    const client=await db();
    const auth=await client.auth.getUser();
    user=auth.data.user?{id:auth.data.user.id,email:auth.data.user.email}:null;
    if(user){
      const profile=await client.from('marketplace_profiles').select('pro_until').eq('id',user.id).maybeSingle();
      proUntil=typeof profile.data?.pro_until==='string'?profile.data.pro_until:null;
    }
  }

  const active=Boolean(proUntil&&new Date(proUntil).getTime()>Date.now());
  const paymentReady=billplzConfigured()&&serviceConfigured();

  return <main id="main" className="container pro-page">
    <section className="pro-hero">
      <span className="pro-icon"><Crown size={24}/></span>
      <p className="eyebrow">PASAR KARAT PRO</p>
      <h1>Make your shop feel like your shop.</h1>
      <p>Keep the same trusted Pasar Karat layout, then unlock your own colours, fonts, featured products and custom store URL.</p>
      {active?<div className="pro-active-note"><strong>Pro active</strong><span>Until {dateLabel(proUntil!)}</span></div>:null}
      {query.payment==='processing'?<div className="form-notice">Your Billplz payment is being confirmed. Pro will activate when the secure callback arrives.</div>:null}
      {query.error?<div className="form-notice error">{query.error==='payment-not-configured'?'Billplz sandbox is not configured yet. Add the server keys first.':'Unable to start the payment. Please try again.'}</div>:null}
    </section>

    <section className="pro-plans" aria-label="Pasar Karat Pro plans">
      <article className="pro-plan-card">
        <span className="pro-plan-kicker">MONTHLY</span>
        <h2>RM9.90</h2>
        <p>30 days of Pro storefront customization.</p>
        {user?<form action={startProCheckout}><input type="hidden" name="plan" value="monthly"/><button className="button" disabled={!paymentReady}>Choose Monthly</button></form>:<Link href="/auth?next=/pro" className="button">Sign in to upgrade</Link>}
      </article>
      <article className="pro-plan-card pro-plan-featured">
        <span className="pro-plan-kicker">BEST VALUE · ANNUAL</span>
        <h2>RM99</h2>
        <p>365 days of Pro and two months effectively free.</p>
        {user?<form action={startProCheckout}><input type="hidden" name="plan" value="annual"/><button className="button" disabled={!paymentReady}>Choose Annual</button></form>:<Link href="/auth?next=/pro" className="button">Sign in to upgrade</Link>}
      </article>
    </section>

    <section className="pro-feature-list">
      {['Accent, background and card colours','Automatic readable text colour','Classic, Clean, Modern, Vintage and Typewriter fonts','Up to four featured products','Custom /shop/ store URL','Pro seller badge'].map(item=><div key={item}><Check size={18}/><span>{item}</span></div>)}
    </section>

    {!paymentReady?<p className="pro-config-note">The storefront features are ready. Billplz checkout stays disabled until the sandbox credentials and public callback URL are added.</p>:null}
  </main>;
}
