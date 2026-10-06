import { SignUpForm } from '../auth-forms';
export const metadata={title:'Create Account'};
export default async function SignupPage({searchParams}:{searchParams:Promise<{next?:string}>}){
  const p=await searchParams;
  return <main id="main" className="container account-shell"><section className="account-card">
    <p className="eyebrow">JOIN THE MARKETPLACE</p><h1>Create your account.</h1>
    <p className="intro">Use one account to submit products and track moderation.</p>
    <SignUpForm next={p.next||'/submit-product'}/>
  </section></main>;
}
