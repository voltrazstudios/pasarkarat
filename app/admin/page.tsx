import { requireAdmin } from '@/lib/admin';
import { approveProduct, rejectProduct } from './actions';
type AdminRow={id:string;name:string;description:string;price:number|string;category:string;pending_image_path:string;submitted_at:string;submitter:{id:string;email:string|null;display_name:string|null};links:{platform:string;seller_url:string;affiliate_url:string|null}[]};

export default async function AdminPage({searchParams}:{searchParams:Promise<{updated?:string;error?:string}>}){
  const client=await requireAdmin();
  const params=await searchParams;
  const result=await client.rpc('marketplace_admin_pending');
  if(result.error)throw new Error('Admin submissions are unavailable.');
  const rows=(result.data||[]) as AdminRow[];
  const reviews=await Promise.all(rows.map(async row=>{
    const signed=await client.storage.from('product-submission-images').createSignedUrl(row.pending_image_path,60*30);
    return {...row,image:signed.data?.signedUrl||null};
  }));

  return <main id="main" className="container moderation-page">
    <div className="submission-heading"><div><p className="eyebrow">PRIVATE MODERATION</p><h1>Product submissions</h1><p className="intro">Review every product before it can appear in the Collection.</p></div><span className="pending-count">{reviews.length} pending</span></div>
    {params.updated&&<div className="form-notice" role="status">Submission {params.updated}.</div>}
    {params.error&&<div className="form-notice error" role="alert">{params.error}</div>}
    {reviews.length?<div className="moderation-list">{reviews.map(row=><article className="moderation-card" key={row.id}>
      <div className="moderation-image">{row.image?<img src={row.image} alt={row.name}/>:<span>Image unavailable</span>}</div>
      <div className="moderation-content">
        <div className="submission-status-line"><span>{row.category}</span><span>{new Date(row.submitted_at).toLocaleString('en-MY')}</span></div>
        <h2>{row.name}</h2><strong className="moderation-price">{new Intl.NumberFormat('en-MY',{style:'currency',currency:'MYR'}).format(Number(row.price))}</strong>
        <p className="moderation-description">{row.description}</p>
        <div className="submitter-box"><strong>Submitter</strong><span>{row.submitter.display_name||'Marketplace member'}</span><span>{row.submitter.email||row.submitter.id}</span></div>
        <div className="admin-links"><strong>Seller links</strong>{row.links.map(link=><div key={link.platform}><span>{link.platform}</span><a href={link.seller_url} target="_blank" rel="noopener noreferrer nofollow">{link.seller_url}</a>{link.affiliate_url&&<a href={link.affiliate_url} target="_blank" rel="noopener noreferrer sponsored">Affiliate: {link.affiliate_url}</a>}</div>)}</div>
        <form className="moderation-actions"><input type="hidden" name="id" value={row.id}/><label>Rejection reason<textarea name="reason" maxLength={500} rows={3} placeholder="Required only when rejecting"/></label><div><button className="button approve-button" formAction={approveProduct}>Approve</button><button className="button secondary reject-button" formAction={rejectProduct}>Reject</button></div></form>
      </div>
    </article>)}</div>:<div className="empty-state"><h2>Nothing waiting for review</h2><p>New product submissions will appear here.</p></div>}
  </main>;
}
