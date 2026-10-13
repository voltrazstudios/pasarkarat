'use server';

import { redirect } from 'next/navigation';
import { BillplzRequestError, billplzConfigured, createBillplzBill } from '@/lib/billplz';
import { configured, db } from '@/lib/supabase';
import { serviceConfigured, serviceDb } from '@/lib/supabase-service';

const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

const productBoostPlans={
  3:{amount:290,durationDays:3,label:'Product Boost — 3 days'},
  7:{amount:590,durationDays:7,label:'Product Boost — 7 days'},
} as const;

const featuredStorePlan={
  amount:790,
  durationDays:7,
  label:'Featured Store Placement — 7 days',
} as const;

export async function startPromotionCheckout(form:FormData){
  const type=String(form.get('promotion_type')||'');
  if(type!=='product_boost'&&type!=='featured_store')redirect('/promote?error=invalid-promotion');
  if(!configured())redirect('/promote?error=not-configured');

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth?next=/promote');
  if(!user.email)redirect('/promote?error=email-required');
  if(!billplzConfigured()||!serviceConfigured())redirect('/promote?error=payment-not-configured');

  const {data:profile}=await client.from('marketplace_profiles')
    .select('display_name,full_name')
    .eq('id',user.id)
    .maybeSingle();

  let productId:string|null=null;
  let productName='';
  let selected:{amount:number;durationDays:number;label:string};

  if(type==='product_boost'){
    const duration=Number(String(form.get('duration_days')||''));
    if(duration!==3&&duration!==7)redirect('/promote?error=invalid-duration');
    selected=productBoostPlans[duration];

    productId=String(form.get('product_id')||'');
    if(!uuid.test(productId))redirect('/promote?error=choose-product');

    const product=await client.from('marketplace_products')
      .select('id,name')
      .eq('id',productId)
      .eq('submitted_by',user.id)
      .eq('status','approved')
      .maybeSingle();

    if(product.error||!product.data)redirect('/promote?error=choose-product');
    productName=product.data.name;
  }else{
    selected=featuredStorePlan;

    const approved=await client.from('marketplace_products')
      .select('id')
      .eq('submitted_by',user.id)
      .eq('status','approved')
      .limit(1);

    if(approved.error||!approved.data?.length)redirect('/promote?error=no-approved-products');
  }

  let checkoutUrl='';
  let stage:'billplz'|'database'='billplz';

  try{
    const bill=await createBillplzBill({
      amount:selected.amount,
      email:user.email,
      name:profile?.full_name||profile?.display_name||'Pasar Karat Seller',
      description:type==='product_boost'?selected.label+' — '+productName:selected.label,
      callbackPath:'/api/billplz/promotions/callback',
      redirectPath:'/promote?payment=processing',
    });

    stage='database';
    const admin=serviceDb();
    const registered=await admin.from('marketplace_promotion_payments').insert({
      bill_id:bill.id,
      user_id:user.id,
      promotion_type:type,
      product_id:productId,
      amount:selected.amount,
      duration_days:selected.durationDays,
      status:'due',
    });

    if(registered.error)throw new Error('Unable to register the promotion payment.');
    checkoutUrl=bill.url;
  }catch(error){
    console.error('[Promotion checkout] failed',{stage,error});
    if(error instanceof BillplzRequestError){
      redirect('/promote?error=billplz&status='+error.status);
    }
    if(stage==='database')redirect('/promote?error=payment-database');
    redirect('/promote?error=payment');
  }

  redirect(checkoutUrl);
}
