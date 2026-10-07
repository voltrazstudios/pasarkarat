import { createHmac, timingSafeEqual } from 'node:crypto';

const defaultBase='https://www.billplz-sandbox.com';

export function billplzConfigured(){
  return Boolean(
    process.env.BILLPLZ_SECRET_KEY
    &&process.env.BILLPLZ_X_SIGNATURE_KEY
    &&process.env.BILLPLZ_COLLECTION_ID
    &&process.env.BILLPLZ_CALLBACK_BASE_URL
    &&process.env.NEXT_PUBLIC_SITE_URL
  );
}

export function billplzBaseUrl(){
  return (process.env.BILLPLZ_BASE_URL||defaultBase).replace(/\/$/,'');
}

export function billplzCollectionId(){
  return process.env.BILLPLZ_COLLECTION_ID||'';
}

export type BillplzBill={id:string;url:string;state?:string;paid?:boolean};

export async function createBillplzBill({
  amount,
  email,
  name,
  description,
}:{
  amount:number;
  email:string;
  name:string;
  description:string;
}):Promise<BillplzBill>{
  if(!billplzConfigured())throw new Error('Billplz is not configured yet.');

  const callbackUrl=new URL('/api/billplz/callback',process.env.BILLPLZ_CALLBACK_BASE_URL!).toString();
  const redirectUrl=new URL('/pro/return',process.env.NEXT_PUBLIC_SITE_URL!).toString();
  const body=new URLSearchParams({
    collection_id:process.env.BILLPLZ_COLLECTION_ID!,
    email,
    name,
    amount:String(amount),
    description,
    callback_url:callbackUrl,
    redirect_url:redirectUrl,
  });

  const auth=Buffer.from(`${process.env.BILLPLZ_SECRET_KEY!}:`).toString('base64');
  const response=await fetch(`${billplzBaseUrl()}/api/v3/bills`,{
    method:'POST',
    headers:{
      Authorization:`Basic ${auth}`,
      'Content-Type':'application/x-www-form-urlencoded',
      Accept:'application/json',
    },
    body,
    cache:'no-store',
  });

  const data=await response.json().catch(()=>null) as Record<string,unknown>|null;
  if(!response.ok||!data||typeof data.id!=='string'||typeof data.url!=='string'){
    throw new Error('Unable to create the Billplz payment right now.');
  }
  return {id:data.id,url:data.url,state:typeof data.state==='string'?data.state:undefined,paid:data.paid===true};
}

export function verifyBillplzSignature(entries:Iterable<[string,string]>,signature:string){
  const key=process.env.BILLPLZ_X_SIGNATURE_KEY;
  if(!key||!signature||!/^[a-f0-9]{64}$/i.test(signature))return false;

  const source=[...entries]
    .filter(([name])=>name.toLowerCase()!=='x_signature')
    .sort(([a],[b])=>a.toLowerCase().localeCompare(b.toLowerCase()))
    .map(([name,value])=>`${name}${value}`)
    .join('|');

  const expected=createHmac('sha256',key).update(source).digest('hex');
  try{
    return timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(signature,'hex'));
  }catch{
    return false;
  }
}
