import { NextResponse } from 'next/server';
import { billplzCollectionId, verifyBillplzSignature } from '@/lib/billplz';
import { serviceDb } from '@/lib/supabase-service';

export const runtime='nodejs';

export async function POST(request:Request){
  const form=await request.formData();
  const entries=[...form.entries()].flatMap(([key,value])=>typeof value==='string'?[[key,value] as [string,string]]:[]);
  const values=Object.fromEntries(entries);
  const signature=values.x_signature||'';

  if(!verifyBillplzSignature(entries,signature)){
    return new NextResponse('Invalid signature',{status:400});
  }

  if(values.collection_id!==billplzCollectionId()){
    return new NextResponse('Invalid collection',{status:400});
  }

  const billId=values.id||'';
  if(!billId)return new NextResponse('Missing bill',{status:400});

  const admin=serviceDb();
  const payment=await admin.from('marketplace_promotion_payments')
    .select('amount,status')
    .eq('bill_id',billId)
    .maybeSingle();

  if(payment.error||!payment.data){
    return new NextResponse('Payment not registered',{status:404});
  }

  const paid=values.paid==='true'&&values.state==='paid';
  if(!paid){
    const state=values.state==='deleted'?'deleted':'due';
    await admin.from('marketplace_promotion_payments').update({status:state}).eq('bill_id',billId);
    return NextResponse.json({ok:true});
  }

  const paidAmount=Number(values.paid_amount||0);
  if(!Number.isInteger(paidAmount)||paidAmount<Number(payment.data.amount)){
    return new NextResponse('Invalid amount',{status:400});
  }

  const parsedPaidAt=values.paid_at?new Date(values.paid_at):null;
  const paidAt=parsedPaidAt&&!Number.isNaN(parsedPaidAt.getTime())?parsedPaidAt.toISOString():new Date().toISOString();
  const activated=await admin.rpc('marketplace_activate_promotion_payment',{
    p_bill_id:billId,
    p_paid_amount:paidAmount,
    p_paid_at:paidAt,
  });

  if(activated.error){
    console.error('[Promotion callback] activation failed',activated.error);
    return new NextResponse('Unable to activate promotion',{status:500});
  }

  return NextResponse.json({ok:true});
}
