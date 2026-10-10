import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { configured, db } from '@/lib/supabase';
import { ProductEditForm } from './form';

export const metadata={title:'Edit Product'};
export const dynamic='force-dynamic';

type ProductRow={
  id:string;
  name:string;
  description:string;
  price:number|string;
  min_price:number|string;
  max_price:number|string;
  category:string;
  status:string;
  public_image_path:string|null;
  marketplace_product_links:{platform:string;seller_url:string;affiliate_url:string|null}[]|null;
};

export default async function EditProductPage({params}:{params:Promise<{id:string}>}){
  if(!configured())redirect('/auth');
  const {id}=await params;
  if(!/^[a-f0-9-]{36}$/i.test(id))notFound();

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect(`/auth?next=${encodeURIComponent(`/edit-product/${id}`)}`);

  const productResult=await client.from('marketplace_products')
    .select('id,name,description,price,min_price,max_price,category,status,public_image_path,marketplace_product_links(platform,seller_url,affiliate_url)')
    .eq('id',id)
    .eq('submitted_by',user.id)
    .maybeSingle();

  if(productResult.error||!productResult.data)notFound();
  const product=productResult.data as unknown as ProductRow;
  if(product.status!=='approved')redirect('/my-submissions');

  const pendingResult=await client.from('marketplace_product_edits')
    .select('id')
    .eq('product_id',id)
    .eq('status','pending')
    .maybeSingle();

  const imageUrl=product.public_image_path
    ? client.storage.from('product-images').getPublicUrl(product.public_image_path).data.publicUrl
    : null;

  return <main id="main" className="container submission-page edit-product-page">
    <div className="submission-heading">
      <div>
        <p className="eyebrow">UPDATE YOUR LISTING</p>
        <h1>Edit product</h1>
        <p className="intro">Your current public product stays live while changes are reviewed.</p>
      </div>
      <Link className="button secondary" href="/my-submissions">Back to submissions</Link>
    </div>

    {pendingResult.data?<div className="form-notice">
      An edit is already waiting for admin review. You can edit this product again after that request is approved or rejected.
    </div>:<ProductEditForm product={{
      id:product.id,
      name:product.name,
      description:product.description,
      minPrice:Number(product.min_price??product.price),
      maxPrice:Number(product.max_price??product.min_price??product.price),
      category:product.category,
      imageUrl,
      links:product.marketplace_product_links||[],
    }}/>}
  </main>;
}
