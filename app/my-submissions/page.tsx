import Link from 'next/link';
import { redirect } from 'next/navigation';
import { configured, db } from '@/lib/supabase';
export const metadata={title:'My Submissions'};
export const dynamic='force-dynamic';
type Row={id:string;slug:string;name:string;price:number|string;category:string;status:string;pending_image_path:string;public_image_path:string|null;rejection_reason:string|null;submitted_at:string};

export default async function MySubmissionsPage({searchParams}:{searchParams:Promise<{submitted?:string}>}){
  if(!configured())redirect('/auth');
  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth?next=/my-submissions');
  const p=await searchParams;
  const {data}=await client.from('marketplace_products').select('id,slug,name,price,category,status,pending_image_path,public_image_path,rejection_reason,submitted_at').eq('submitted_by',user.id).order('submitted_at',{ascending:false});
  const rows=(data||[]) as Row[];
  const withImages=await Promise.all(rows.map(async row=>{
    if(row.status==='approved'&&row.public_image_path)return {...row,image:client.storage.from('product-images').getPublicUrl(row.public_image_path).data.publicUrl};
    const signed=await client.storage.from('product-submission-images').createSignedUrl(row.pending_image_path,60*30);
    return {...row,image:signed.data?.signedUrl||null};
  }));
  return <main id="main" className="container submissions-dashboard">
    <div className="submission-heading"><div><p className="eyebrow">YOUR MARKETPLACE</p><h1>My submissions</h1><p className="intro">Track what is waiting for review and what has been approved.</p></div><div className="dashboard-actions"><Link href="/submit-product" prefetch={false} className="button">Submit another product</Link></div></div>
    {p.submitted==='1'&&<div className="form-notice" role="status">Product submitted. It is private while an administrator reviews it.</div>}
    {withImages.length?<div className="submission-list">{withImages.map(row=><article className="submission-row" key={row.id}>
      <div className="submission-thumb">{row.image?<img src={row.image} alt={row.name}/>:<span>Image unavailable</span>}</div>
      <div className="submission-copy"><div className="submission-status-line"><span className="status-pill" data-status={row.status}>{row.status}</span><span>{new Date(row.submitted_at).toLocaleDateString('en-MY')}</span></div><h2>{row.name}</h2><p>{row.category} · {new Intl.NumberFormat('en-MY',{style:'currency',currency:'MYR'}).format(Number(row.price))}</p>{row.status==='rejected'&&row.rejection_reason&&<p className="rejection-reason"><strong>Reason:</strong> {row.rejection_reason}</p>}{row.status==='approved'&&<Link className="text-link" href={`/items/${row.slug}`}>View public product</Link>}</div>
    </article>)}</div>:<div className="empty-state"><h2>No submissions yet</h2><p>Your submitted products will appear here.</p><Link href="/submit-product" prefetch={false} className="button">Submit a product</Link></div>}
  </main>;
}
