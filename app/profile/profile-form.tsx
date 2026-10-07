'use client';

import { useActionState } from 'react';
import { updateProfile, type ProfileResult } from './actions';

export function ProfileForm({name,description}:{name:string;description:string}){
  const [state,action,pending]=useActionState<ProfileResult,FormData>(updateProfile,{});

  return <form action={action} className="market-form profile-edit-form">
    <label>
      Name
      <input name="display_name" required minLength={2} maxLength={60} defaultValue={name} autoComplete="name"/>
      <small>This is the name people will see on your seller profile.</small>
    </label>

    <label>
      Description
      <textarea name="description" maxLength={300} rows={5} defaultValue={description} placeholder="Tell people a little about your store, collection, or the kinds of items you share."/>
      <small>Maximum 300 characters.</small>
    </label>

    {state.error?<div className="form-notice error" role="alert">{state.error}</div>:null}
    {state.message?<div className="form-notice" role="status">{state.message}</div>:null}

    <button className="button full-button" type="submit" disabled={pending}>{pending?'Saving…':'Save profile'}</button>
  </form>;
}
