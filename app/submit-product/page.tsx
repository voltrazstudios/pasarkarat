import Link from 'next/link';
import { redirect } from 'next/navigation';
import { configured, db } from '@/lib/supabase';
import { ProductSubmissionForm } from './form';
export const metadata={title:'Submit a Product'};
export const dynamic='force-dynamic';

export default async function SubmitProductPage(){
  if(!configured())return <main id="main" className="container submission-page"><div className="submission-heading"><p className="eyebrow">COMMUNITY COLLECTION</p><h1>Submit a product</h1></div><div className="form-notice error">Pasar Karat Supabase is not configured yet. Follow SUPABASE-SETUP.md first.</div></main>;
  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth?next=/submit-product');
  return <main id="main" className="container submission-page">
    <div className="submission-heading"><div><p className="eyebrow">COMMUNITY COLLECTION</p><h1>Submit a product</h1><p className="intro">Share a find from your shop or collection. We&apos;ll review it before it appears publicly.</p></div><Link className="text-link" href="/my-submissions" prefetch={false}>My submissions</Link></div>
    <ProductSubmissionForm/>
  </main>;
}
