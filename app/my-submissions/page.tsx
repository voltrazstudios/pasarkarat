import Link from 'next/link';
import { redirect } from 'next/navigation';
import { configured, db } from '@/lib/supabase';
import { SubmissionsList, type SubmissionListRow } from './submissions-list';

export const metadata={title:'My Submissions'};
export const dynamic='force-dynamic';

type Row={
  id:string;
  slug:string;
  name:string;
  price:number|string;
  min_price:number|string;
  max_price:number|string;
  category:string;
  status:string;
  pending_image_path:string;
  public_image_path:string|null;
  rejection_reason:string|null;
  submitted_at:string;
};

type EditRow={
  id:string;
  product_id:string;
  status:string;
  rejection_reason:string|null;
  submitted_at:string;
};

export default async function MySubmissionsPage({searchParams}:{searchParams:Promise<{submitted?:string;edit?:string}>}){
  if(!configured())redirect('/auth');

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth?next=/my-submissions');

  const p=await searchParams;
  const {data}=await client.from('marketplace_products')
    .select('id,slug,name,price,min_price,max_price,category,status,pending_image_path,public_image_path,rejection_reason,submitted_at')
    .eq('submitted_by',user.id)
    .order('submitted_at',{ascending:false});

  const rows=(data||[]) as Row[];
  const productIds=rows.map(row=>row.id);

  let edits:EditRow[]=[];
  if(productIds.length){
    const editResult=await client.from('marketplace_product_edits')
      .select('id,product_id,status,rejection_reason,submitted_at')
      .in('product_id',productIds)
      .order('submitted_at',{ascending:false});
    if(!editResult.error)edits=(editResult.data||[]) as EditRow[];
  }

  const latestEditByProduct=new Map<string,EditRow>();
  for(const edit of edits){
    if(!latestEditByProduct.has(edit.product_id))latestEditByProduct.set(edit.product_id,edit);
  }

  const withImages:SubmissionListRow[]=await Promise.all(rows.map(async row=>{
    let image:string|null=null;
    if(row.status==='approved'&&row.public_image_path){
      image=client.storage.from('product-images').getPublicUrl(row.public_image_path).data.publicUrl;
    }else{
      const signed=await client.storage.from('product-submission-images').createSignedUrl(row.pending_image_path,60*30);
      image=signed.data?.signedUrl||null;
    }
    return {...row,image,latestEdit:latestEditByProduct.get(row.id)||null};
  }));

  return <main id="main" className="container submissions-dashboard">
    <div className="submission-heading">
      <div>
        <p className="eyebrow">YOUR MARKETPLACE</p>
        <h1>My submissions</h1>
        <p className="intro">Search, manage and track products you have submitted to Pasar Karat.</p>
      </div>
      <div className="dashboard-actions">
        <Link href="/submit-product" prefetch={false} className="button">Submit another product</Link>
      </div>
    </div>

    {p.submitted==='1'?<div className="form-notice" role="status">Product submitted. It is private while an administrator reviews it.</div>:null}
    {p.edit==='submitted'?<div className="form-notice" role="status">Your edit was submitted for review. The current product stays live until an administrator approves the changes.</div>:null}

    <SubmissionsList initialRows={withImages}/>
  </main>;
}
