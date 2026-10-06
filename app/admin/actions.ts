'use server';

import sharp from 'sharp';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

function destination(kind:'updated'|'error',message:string){return `/admin?${kind}=${encodeURIComponent(message)}`;}

export async function moderateProduct(f:FormData){
  const client=await requireAdmin();
  const id=String(f.get('id')||'');
  const decision=String(f.get('decision')||'');
  const reason=String(f.get('reason')||'').trim().slice(0,500);

  if(!/^[a-f0-9-]{36}$/i.test(id))redirect(destination('error','Invalid product.'));
  if(decision!=='approve'&&decision!=='reject')redirect(destination('error','Invalid moderation action.'));
  if(decision==='reject'&&!reason)redirect(destination('error','Add a rejection reason before rejecting.'));

  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect(destination('error','Admin session expired.'));

  const lookup=await client.from('marketplace_products').select('id,submitted_by,status,pending_image_path').eq('id',id).maybeSingle();
  if(lookup.error||!lookup.data||lookup.data.status!=='pending')redirect(destination('error','This submission is no longer pending.'));

  if(decision==='reject'){
    const result=await client.rpc('marketplace_admin_decide',{p_id:id,p_decision:'rejected',p_reason:reason,p_public_image_path:null});
    if(result.error)redirect(destination('error','Unable to reject this submission.'));
    revalidatePath('/admin');revalidatePath('/my-submissions');
    redirect(destination('updated','rejected'));
  }

  if(lookup.data.submitted_by===user.id)redirect(destination('error','Administrators cannot approve their own submissions.'));

  const downloaded=await client.storage.from('product-submission-images').download(lookup.data.pending_image_path);
  if(downloaded.error||!downloaded.data)redirect(destination('error','Unable to read the pending image.'));

  let safeImage:Buffer;
  try{
    const input=Buffer.from(await downloaded.data.arrayBuffer());
    safeImage=await sharp(input,{failOn:'error',limitInputPixels:40000000}).rotate().resize({width:1800,height:1800,fit:'inside',withoutEnlargement:true}).webp({quality:88}).toBuffer();
  }catch{
    redirect(destination('error','The pending image failed the final safety check.'));
  }

  const publicPath=`approved/${id}-${crypto.randomUUID()}.webp`;
  const upload=await client.storage.from('product-images').upload(publicPath,safeImage,{contentType:'image/webp',upsert:false,cacheControl:'31536000'});
  if(upload.error)redirect(destination('error','Unable to publish the approved image.'));

  const decided=await client.rpc('marketplace_admin_decide',{p_id:id,p_decision:'approved',p_reason:null,p_public_image_path:publicPath});
  if(decided.error){
    await client.storage.from('product-images').remove([publicPath]);
    redirect(destination('error',decided.error.message.includes('own submission')?'Administrators cannot approve their own submissions.':'Unable to approve this submission.'));
  }

  await client.storage.from('product-submission-images').remove([lookup.data.pending_image_path]);
  revalidatePath('/admin');revalidatePath('/items');revalidatePath('/saved');revalidatePath('/my-submissions');
  redirect(destination('updated','approved'));
}
