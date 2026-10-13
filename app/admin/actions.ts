'use server';

import sharp from 'sharp';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

function destination(kind:'updated'|'error',message:string){return `/admin?${kind}=${encodeURIComponent(message)}`;}

async function moderateProduct(decision:'approve'|'reject',f:FormData){
  const client=await requireAdmin();
  const id=String(f.get('id')||'');
  const reason=String(f.get('reason')||'').trim().slice(0,500);

  if(!/^[a-f0-9-]{36}$/i.test(id))redirect(destination('error','Invalid product.'));
  if(decision==='reject'&&!reason)redirect(destination('error','Add a rejection reason before rejecting.'));

  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect(destination('error','Admin session expired.'));

  const lookup=await client.from('marketplace_products')
    .select('id,submitted_by,status,pending_image_path,pending_story_image_paths,pending_certificate_image_path')
    .eq('id',id)
    .maybeSingle();

  if(lookup.error||!lookup.data||lookup.data.status!=='pending'){
    redirect(destination('error','This submission is no longer pending.'));
  }

  if(decision==='reject'){
    const result=await client.rpc('marketplace_admin_decide_rich',{
      p_id:id,
      p_decision:'rejected',
      p_reason:reason,
      p_public_image_path:null,
      p_public_story_image_paths:[],
      p_public_certificate_image_path:null,
    });
    if(result.error)redirect(destination('error','Unable to reject this submission.'));
    revalidatePath('/admin');
    revalidatePath('/my-submissions');
    redirect(destination('updated','rejected'));
  }

  if(lookup.data.submitted_by===user.id){
    redirect(destination('error','Administrators cannot approve their own submissions.'));
  }

  const publishedPaths:string[]=[];

  async function publishPendingImage(privatePath:string){
    const downloaded=await client.storage.from('product-submission-images').download(privatePath);
    if(downloaded.error||!downloaded.data)throw new Error('Unable to read one of the pending images.');

    const input=Buffer.from(await downloaded.data.arrayBuffer());
    const safeImage=await sharp(input,{failOn:'error',limitInputPixels:40000000})
      .rotate()
      .resize({width:1800,height:1800,fit:'inside',withoutEnlargement:true})
      .webp({quality:88})
      .toBuffer();

    const publicPath=`approved/${id}-${crypto.randomUUID()}.webp`;
    const upload=await client.storage.from('product-images')
      .upload(publicPath,safeImage,{contentType:'image/webp',upsert:false,cacheControl:'31536000'});

    if(upload.error)throw new Error('Unable to publish one of the approved images.');
    publishedPaths.push(publicPath);
    return publicPath;
  }

  let publicPath:string;
  let publicStoryPaths:string[]=[];
  let publicCertificatePath:string|null=null;

  try{
    publicPath=await publishPendingImage(lookup.data.pending_image_path);

    for(const privatePath of lookup.data.pending_story_image_paths||[]){
      publicStoryPaths.push(await publishPendingImage(privatePath));
    }

    if(lookup.data.pending_certificate_image_path){
      publicCertificatePath=await publishPendingImage(lookup.data.pending_certificate_image_path);
    }
  }catch(error){
    if(publishedPaths.length)await client.storage.from('product-images').remove(publishedPaths);
    redirect(destination('error',error instanceof Error?error.message:'The pending media failed the final safety check.'));
  }

  const decided=await client.rpc('marketplace_admin_decide_rich',{
    p_id:id,
    p_decision:'approved',
    p_reason:null,
    p_public_image_path:publicPath,
    p_public_story_image_paths:publicStoryPaths,
    p_public_certificate_image_path:publicCertificatePath,
  });

  if(decided.error){
    if(publishedPaths.length)await client.storage.from('product-images').remove(publishedPaths);
    redirect(destination('error',decided.error.message.includes('own submission')
      ?'Administrators cannot approve their own submissions.'
      :'Unable to approve this submission.'));
  }

  const privatePaths=[
    lookup.data.pending_image_path,
    ...(lookup.data.pending_story_image_paths||[]),
    lookup.data.pending_certificate_image_path,
  ].filter((value):value is string=>typeof value==='string'&&Boolean(value));

  if(privatePaths.length){
    await client.storage.from('product-submission-images').remove([...new Set(privatePaths)]);
  }

  revalidatePath('/admin');
  revalidatePath('/items');
  revalidatePath('/saved');
  revalidatePath('/my-submissions');
  revalidatePath('/');
  redirect(destination('updated','approved'));
}


export async function approveProduct(f:FormData){
  return moderateProduct('approve',f);
}

export async function rejectProduct(f:FormData){
  return moderateProduct('reject',f);
}


export async function deletePublishedProduct(f:FormData){
  const client=await requireAdmin();
  const id=String(f.get('id')||'');
  if(!/^[a-f0-9-]{36}$/i.test(id))redirect(destination('error','Invalid product.'));

  const deleted=await client.rpc('marketplace_admin_delete_product',{p_id:id});
  if(deleted.error)redirect(destination('error','Unable to delete this product.'));

  const result=deleted.data as {
    public_image_path?:string|null;
    pending_image_path?:string|null;
    edit_image_paths?:unknown;
    public_story_image_paths?:unknown;
    pending_story_image_paths?:unknown;
    public_certificate_image_path?:string|null;
    pending_certificate_image_path?:string|null;
  }|null;

  const publicPaths=[
    result?.public_image_path,
    ...(Array.isArray(result?.public_story_image_paths)?result!.public_story_image_paths:[]),
    result?.public_certificate_image_path,
  ].filter((value):value is string=>typeof value==='string'&&Boolean(value));

  if(publicPaths.length){
    await client.storage.from('product-images').remove([...new Set(publicPaths)]);
  }

  const privatePaths=[
    result?.pending_image_path,
    ...(Array.isArray(result?.edit_image_paths)?result!.edit_image_paths:[]),
    ...(Array.isArray(result?.pending_story_image_paths)?result!.pending_story_image_paths:[]),
    result?.pending_certificate_image_path,
  ].filter((value):value is string=>typeof value==='string'&&Boolean(value));

  if(privatePaths.length){
    await client.storage.from('product-submission-images').remove([...new Set(privatePaths)]);
  }

  revalidatePath('/admin');
  revalidatePath('/items');
  revalidatePath('/saved');
  revalidatePath('/my-submissions');
  redirect(destination('updated','deleted'));
}


async function moderateProductEdit(decision:'approve'|'reject',f:FormData){
  const client=await requireAdmin();
  const id=String(f.get('edit_id')||'');
  const reason=String(f.get('reason')||'').trim().slice(0,500);

  if(!/^[a-f0-9-]{36}$/i.test(id))redirect(destination('error','Invalid edit request.'));
  if(decision==='reject'&&!reason)redirect(destination('error','Add a rejection reason before rejecting this edit.'));

  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect(destination('error','Admin session expired.'));

  const lookup=await client.from('marketplace_product_edits')
    .select('id,product_id,submitted_by,status,pending_image_path')
    .eq('id',id)
    .maybeSingle();

  if(lookup.error||!lookup.data||lookup.data.status!=='pending'){
    redirect(destination('error','This edit request is no longer pending.'));
  }

  if(decision==='reject'){
    const result=await client.rpc('marketplace_admin_decide_edit',{
      p_edit_id:id,
      p_decision:'rejected',
      p_reason:reason,
      p_public_image_path:null,
    });
    if(result.error)redirect(destination('error','Unable to reject this edit request.'));
    if(lookup.data.pending_image_path){
      await client.storage.from('product-submission-images').remove([lookup.data.pending_image_path]);
    }
    revalidatePath('/admin');
    revalidatePath('/my-submissions');
    redirect(destination('updated','edit rejected'));
  }

  if(lookup.data.submitted_by===user.id){
    redirect(destination('error','Administrators cannot approve their own edits.'));
  }

  let publicPath:string|null=null;

  if(lookup.data.pending_image_path){
    const downloaded=await client.storage.from('product-submission-images').download(lookup.data.pending_image_path);
    if(downloaded.error||!downloaded.data)redirect(destination('error','Unable to read the replacement image.'));

    let safeImage:Buffer;
    try{
      const input=Buffer.from(await downloaded.data.arrayBuffer());
      safeImage=await sharp(input,{failOn:'error',limitInputPixels:40000000})
        .rotate()
        .resize({width:1800,height:1800,fit:'inside',withoutEnlargement:true})
        .webp({quality:88})
        .toBuffer();
    }catch{
      redirect(destination('error','The replacement image failed the final safety check.'));
    }

    publicPath=`approved/${lookup.data.product_id}-${crypto.randomUUID()}.webp`;
    const upload=await client.storage.from('product-images')
      .upload(publicPath,safeImage,{contentType:'image/webp',upsert:false,cacheControl:'31536000'});
    if(upload.error)redirect(destination('error','Unable to publish the replacement image.'));
  }

  const decided=await client.rpc('marketplace_admin_decide_edit',{
    p_edit_id:id,
    p_decision:'approved',
    p_reason:null,
    p_public_image_path:publicPath,
  });

  if(decided.error){
    if(publicPath)await client.storage.from('product-images').remove([publicPath]);
    redirect(destination('error',decided.error.message.includes('own edit')
      ?'Administrators cannot approve their own edits.'
      :'Unable to approve this edit request.'));
  }

  const result=decided.data as {
    pending_image_path?:string|null;
    old_public_image_path?:string|null;
  }|null;

  if(result?.pending_image_path){
    await client.storage.from('product-submission-images').remove([result.pending_image_path]);
  }
  if(result?.old_public_image_path){
    await client.storage.from('product-images').remove([result.old_public_image_path]);
  }

  revalidatePath('/admin');
  revalidatePath('/items');
  revalidatePath('/saved');
  revalidatePath('/my-submissions');
  revalidatePath('/');
  redirect(destination('updated','edit approved'));
}

export async function approveProductEdit(f:FormData){
  return moderateProductEdit('approve',f);
}

export async function rejectProductEdit(f:FormData){
  return moderateProductEdit('reject',f);
}


async function moderateAd(decision:'approve'|'reject',f:FormData){
  const client=await requireAdmin();
  const id=String(f.get('ad_id')||'');
  const reason=String(f.get('reason')||'').trim().slice(0,500);

  if(!/^[a-f0-9-]{36}$/i.test(id))redirect(destination('error','Invalid ad.'));
  if(decision==='reject'&&!reason)redirect(destination('error','Add a rejection reason before rejecting this ad.'));

  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect(destination('error','Admin session expired.'));

  const lookup=await client.from('marketplace_ads')
    .select('id,submitted_by,status,pending_desktop_path,pending_mobile_path')
    .eq('id',id)
    .maybeSingle();

  if(lookup.error||!lookup.data||lookup.data.status!=='pending'){
    redirect(destination('error','This ad is no longer pending.'));
  }

  if(decision==='reject'){
    const rejected=await client.rpc('marketplace_admin_decide_ad',{
      p_id:id,
      p_decision:'rejected',
      p_reason:reason,
      p_public_desktop_path:null,
      p_public_mobile_path:null,
    });
    if(rejected.error)redirect(destination('error','Unable to reject this ad.'));
    revalidatePath('/admin');
    revalidatePath('/advertise');
    redirect(destination('updated','ad rejected'));
  }

  if(lookup.data.submitted_by===user.id){
    redirect(destination('error','Administrators cannot approve their own ads.'));
  }

  const published:string[]=[];
  async function publish(privatePath:string,kind:'desktop'|'mobile'){
    const downloaded=await client.storage.from('marketplace-ad-submissions').download(privatePath);
    if(downloaded.error||!downloaded.data)throw new Error('Unable to read the pending ad image.');

    const input=Buffer.from(await downloaded.data.arrayBuffer());
    const target=kind==='desktop'?{width:1800,height:600}:{width:1200,height:900};
    const safe=await sharp(input,{failOn:'error',limitInputPixels:40000000})
      .rotate()
      .resize({...target,fit:'cover',position:'centre'})
      .webp({quality:90})
      .toBuffer();

    const publicPath=`approved/${crypto.randomUUID()}.webp`;
    const upload=await client.storage.from('marketplace-ad-images')
      .upload(publicPath,safe,{contentType:'image/webp',upsert:false,cacheControl:'31536000'});
    if(upload.error)throw new Error('Unable to publish the approved ad image.');
    published.push(publicPath);
    return publicPath;
  }

  let desktopPath='';
  let mobilePath='';
  try{
    desktopPath=await publish(lookup.data.pending_desktop_path,'desktop');
    mobilePath=await publish(lookup.data.pending_mobile_path,'mobile');
  }catch(error){
    if(published.length)await client.storage.from('marketplace-ad-images').remove(published);
    redirect(destination('error',error instanceof Error?error.message:'The ad images failed the final safety check.'));
  }

  const approved=await client.rpc('marketplace_admin_decide_ad',{
    p_id:id,
    p_decision:'approved',
    p_reason:null,
    p_public_desktop_path:desktopPath,
    p_public_mobile_path:mobilePath,
  });

  if(approved.error){
    if(published.length)await client.storage.from('marketplace-ad-images').remove(published);
    redirect(destination('error',approved.error.message.includes('own ad')
      ?'Administrators cannot approve their own ads.'
      :'Unable to approve this ad.'));
  }

  await client.storage.from('marketplace-ad-submissions').remove([
    lookup.data.pending_desktop_path,
    lookup.data.pending_mobile_path,
  ]);

  revalidatePath('/admin');
  revalidatePath('/advertise');
  revalidatePath('/');
  revalidatePath('/items');
  redirect(destination('updated','ad approved'));
}

export async function approveAd(f:FormData){
  return moderateAd('approve',f);
}

export async function rejectAd(f:FormData){
  return moderateAd('reject',f);
}
