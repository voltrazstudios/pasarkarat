import { SignInForm } from './auth-forms';
export const metadata={title:'Sign In'};
export default async function AuthPage({searchParams}:{searchParams:Promise<{next?:string;error?:string;password?:string}>}){
  const p=await searchParams;
  const next=p.next||'/submit-product';
  return <main id="main" className="container account-shell"><section className="account-card">
    <p className="eyebrow">MARKETPLACE ACCOUNT</p><h1>Welcome back.</h1>
    <p className="intro">Sign in to submit a product and follow its review status.</p>
    {p.password==='updated'&&<div className="form-notice" role="status">Password updated. Sign in with your new password.</div>}
    {p.error&&<div className="form-notice error" role="alert">This confirmation link could not be used. Please sign in or request a new link.</div>}
    <SignInForm next={next}/>
  </section></main>;
}
