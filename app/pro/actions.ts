'use server';

import { redirect } from 'next/navigation';
import { createBillplzBill, billplzConfigured } from '@/lib/billplz';
import { configured, db } from '@/lib/supabase';
import { serviceConfigured, serviceDb } from '@/lib/supabase-service';

const plans={
  monthly:{amount:990,durationDays:30,label:'Pasar Karat Pro — 30 days'},
  annual:{amount:9900,durationDays:365,label:'Pasar Karat Pro — 365 days'},
} as const;

export async function startProCheckout(form:FormData){
  const plan=String(form.get('plan')||'') as keyof typeof plans;
  if(!(plan in plans))redirect('/pro?error=invalid-plan');
  if(!configured())redirect('/pro?error=not-configured');

  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth?next=/pro');
  if(!billplzConfigured()||!serviceConfigured())redirect('/pro?error=payment-not-configured');

  const {data:profile}=await client.from('marketplace_profiles')
    .select('display_name,full_name')
    .eq('id',user.id)
    .maybeSingle();

  let checkoutUrl='';
  try{
    const selected=plans[plan];
    const bill=await createBillplzBill({
      amount:selected.amount,
      email:user.email||'',
      name:profile?.full_name||profile?.display_name||'Pasar Karat Seller',
      description:selected.label,
    });

    const admin=serviceDb();
    const registered=await admin.from('marketplace_pro_payments').insert({
      bill_id:bill.id,
      user_id:user.id,
      plan,
      amount:selected.amount,
      duration_days:selected.durationDays,
      status:'due',
    });
    if(registered.error)throw new Error('Unable to register the Pro payment.');
    checkoutUrl=bill.url;
  }catch{
    redirect('/pro?error=payment');
  }

  redirect(checkoutUrl);
}
