import { redirect } from 'next/navigation';
import { configured, db } from '@/lib/supabase';
import { ResetPasswordForm } from '../auth-forms';
export const metadata={title:'Reset Password'};
export const dynamic='force-dynamic';
export default async function ResetPasswordPage(){
  if(!configured())redirect('/auth');
  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/auth/forgot-password?error=invalid');
  return <main id="main" className="container account-shell"><section className="account-card">
    <p className="eyebrow">ACCOUNT RECOVERY</p><h1>Choose a new password.</h1><ResetPasswordForm/>
  </section></main>;
}
