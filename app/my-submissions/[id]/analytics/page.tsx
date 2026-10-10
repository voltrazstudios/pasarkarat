import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BarChart3, Eye, MousePointerClick, Users } from 'lucide-react';
import { configured, db } from '@/lib/supabase';
import { platformDisplayName, type Platform } from '@/data/products';

export const metadata={title:'Product Analytics'};
export const dynamic='force-dynamic';

type PlatformAnalytics={platform:string;people:number|string;clicks:number|string};
type Analytics={
  id:string;
  name:string;
  slug:string;
  status:string;
  unique_viewers:number|string;
  total_views:number|string;
  platforms:PlatformAnalytics[];
};

export default async function ProductAnalyticsPage({params}:{params:Promise<{id:string}>}){
  if(!configured())redirect('/auth');
  const {id}=await params;
  if(!/^[a-f0-9-]{36}$/i.test(id))notFound();

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect(`/auth?next=${encodeURIComponent(`/my-submissions/${id}/analytics`)}`);

  const result=await client.rpc('marketplace_my_product_analytics',{p_id:id});
  if(result.error||!result.data)notFound();

  const analytics=result.data as Analytics;
  const platforms=Array.isArray(analytics.platforms)?analytics.platforms:[];
  const totalClicks=platforms.reduce((sum,row)=>sum+Number(row.clicks||0),0);

  return <main id="main" className="container submission-analytics-page">
    <div className="submission-heading">
      <div>
        <p className="eyebrow">PRODUCT PERFORMANCE</p>
        <h1>{analytics.name}</h1>
        <p className="intro">See how many people discover your product and which marketplace links they use.</p>
      </div>
      <div className="dashboard-actions">
        {analytics.status==='approved'?<Link className="button secondary" href={`/items/${analytics.slug}`}>View public product</Link>:null}
        <Link className="button secondary" href="/my-submissions">Back to submissions</Link>
      </div>
    </div>

    <div className="analytics-summary-grid">
      <article><Users size={22}/><span>Unique viewers</span><strong>{Number(analytics.unique_viewers||0).toLocaleString('en-MY')}</strong></article>
      <article><Eye size={22}/><span>Total views</span><strong>{Number(analytics.total_views||0).toLocaleString('en-MY')}</strong></article>
      <article><MousePointerClick size={22}/><span>Platform clicks</span><strong>{totalClicks.toLocaleString('en-MY')}</strong></article>
    </div>

    <section className="analytics-platform-section">
      <div className="admin-section-heading">
        <div><p className="eyebrow">MARKETPLACE LINKS</p><h2>Clicks by platform</h2></div>
      </div>

      {platforms.length?<div className="analytics-platform-list">{platforms.map(row=><article key={row.platform}>
        <div className="analytics-platform-name"><BarChart3 size={18}/><strong>{platformDisplayName(row.platform as Platform)}</strong></div>
        <div><span>People</span><strong>{Number(row.people||0).toLocaleString('en-MY')}</strong></div>
        <div><span>Clicks</span><strong>{Number(row.clicks||0).toLocaleString('en-MY')}</strong></div>
      </article>)}</div>:<div className="empty-state"><h2>No platform data yet</h2><p>Clicks will appear here after people open your seller links.</p></div>}

      <p className="analytics-note">Unique viewers and people are counted using a privacy-friendly browser identifier. No visitor names, emails or profile details are stored for these analytics.</p>
    </section>
  </main>;
}
