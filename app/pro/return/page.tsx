import Link from 'next/link';

export const metadata={title:'Payment confirmation'};
export const dynamic='force-dynamic';

export default function ProReturnPage(){
  return <main id="main" className="container pro-return-page">
    <section className="account-card">
      <p className="eyebrow">PASAR KARAT PRO</p>
      <h1>Payment received.</h1>
      <p>Billplz is confirming the payment securely with Pasar Karat. Your Pro access activates from the server callback, not from this browser page.</p>
      <Link href="/pro?payment=processing" className="button">Check Pro status</Link>
    </section>
  </main>;
}
