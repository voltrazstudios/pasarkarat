import { ForgotPasswordForm } from '../auth-forms';
export const metadata={title:'Forgot Password'};
export default async function ForgotPasswordPage({searchParams}:{searchParams:Promise<{error?:string}>}){
  const p=await searchParams;
  return <main id="main" className="container account-shell"><section className="account-card">
    <p className="eyebrow">ACCOUNT RECOVERY</p><h1>Reset your password.</h1>
    <p className="intro">Enter your email and we&apos;ll send a secure reset link.</p>
    {p.error&&<div className="form-notice error" role="alert">That reset link is invalid or expired. Request a new one.</div>}
    <ForgotPasswordForm/>
  </section></main>;
}
