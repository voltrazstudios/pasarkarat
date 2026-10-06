'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { authenticate, createAccount, requestPasswordReset, updatePassword, type AuthResult } from './actions';

function Feedback({state}:{state:AuthResult}){
  if(state.error)return <div className="form-notice error" role="alert">{state.error}</div>;
  if(state.message)return <div className="form-notice" role="status">{state.message}</div>;
  return null;
}
export function SignInForm({next}:{next:string}){
  const [state,action,pending]=useActionState(authenticate,{});
  return <form action={action} className="market-form auth-form">
    <input type="hidden" name="next" value={next}/>
    <label>Email<input name="email" type="email" required autoComplete="email"/></label>
    <label>Password<input name="password" type="password" minLength={8} required autoComplete="current-password"/></label>
    <Feedback state={state}/>
    <button className="button full-button" disabled={pending}>{pending?'Signing in…':'Sign in'}</button>
    <p className="form-foot"><Link href="/auth/forgot-password">Forgot password?</Link></p>
    <p className="form-foot">New here? <Link href={`/auth/signup?next=${encodeURIComponent(next)}`}>Create account</Link></p>
  </form>;
}
export function SignUpForm({next}:{next:string}){
  const [state,action,pending]=useActionState(createAccount,{});
  return <form action={action} className="market-form auth-form">
    <input type="hidden" name="next" value={next}/>
    <label>Display name<input name="display_name" minLength={2} maxLength={60} required autoComplete="name"/></label>
    <label>Email<input name="email" type="email" required autoComplete="email"/></label>
    <label>Password<input name="password" type="password" minLength={8} required autoComplete="new-password"/></label>
    <label>Confirm password<input name="confirm_password" type="password" minLength={8} required autoComplete="new-password"/></label>
    <Feedback state={state}/>
    <button className="button full-button" disabled={pending}>{pending?'Creating account…':'Create account'}</button>
    <p className="form-foot">Already have an account? <Link href={`/auth?next=${encodeURIComponent(next)}`}>Sign in</Link></p>
  </form>;
}
export function ForgotPasswordForm(){
  const [state,action,pending]=useActionState(requestPasswordReset,{});
  return <form action={action} className="market-form auth-form">
    <label>Email<input name="email" type="email" required autoComplete="email"/></label>
    <Feedback state={state}/>
    <button className="button full-button" disabled={pending}>{pending?'Sending…':'Send reset link'}</button>
    <p className="form-foot"><Link href="/auth">Back to sign in</Link></p>
  </form>;
}
export function ResetPasswordForm(){
  const [state,action,pending]=useActionState(updatePassword,{});
  return <form action={action} className="market-form auth-form">
    <label>New password<input name="password" type="password" minLength={8} required autoComplete="new-password"/></label>
    <label>Confirm password<input name="confirm_password" type="password" minLength={8} required autoComplete="new-password"/></label>
    <Feedback state={state}/>
    <button className="button full-button" disabled={pending}>{pending?'Updating…':'Update password'}</button>
  </form>;
}
