import Link from 'next/link';

export const metadata={title:'Promotion payment confirmation'};
export const dynamic='force-dynamic';

export default function PromotionReturnPage(){
  return <main id="main" className="container pro-return-page">
    <section className="account-card">
      <p className="eyebrow">SELLER PROMOTION</p>
      <h1>Payment received.</h1>
      <p>Billplz is confirming the payment securely with Pasar Karat. Your boost or featured placement activates from the server callback.</p>
      <Link href="/promote?payment=processing" className="button">Check promotion status</Link>
    </section>
  </main>;
}
