'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Camera, UserRound } from 'lucide-react';
import { signOut } from '@/app/auth/actions';
import { updateProfile, type ProfileResult } from './actions';

type Props={
  username:string;
  description:string;
  fullName:string;
  email:string;
  phone:string;
  gender:string;
  dateOfBirth:string;
  avatarUrl:string;
};

export function ProfileForm(props:Props){
  const [state,action,pending]=useActionState<ProfileResult,FormData>(updateProfile,{});
  const [avatarPreview,setAvatarPreview]=useState(props.avatarUrl);
  const [removeAvatar,setRemoveAvatar]=useState(false);
  const [avatarMenuOpen,setAvatarMenuOpen]=useState(false);
  const avatarInput=useRef<HTMLInputElement>(null);
  const avatarMenu=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    if(!avatarMenuOpen)return;
    const close=(event:MouseEvent|TouchEvent)=>{
      if(avatarMenu.current&&!avatarMenu.current.contains(event.target as Node))setAvatarMenuOpen(false);
    };
    document.addEventListener('mousedown',close);
    document.addEventListener('touchstart',close);
    return()=>{
      document.removeEventListener('mousedown',close);
      document.removeEventListener('touchstart',close);
    };
  },[avatarMenuOpen]);

  return <form action={action} className="market-form profile-edit-form">
    <div className="profile-picture-editor" ref={avatarMenu}>
      <button
        type="button"
        className="profile-picture-button"
        aria-label="Change profile picture"
        aria-expanded={avatarMenuOpen}
        onClick={()=>setAvatarMenuOpen(open=>!open)}
      >
        <span className="profile-picture-visual">
          {avatarPreview?<img src={avatarPreview} alt=""/>:<UserRound size={46} strokeWidth={1.5}/>}
          <span className="profile-picture-badge" aria-hidden="true"><Camera size={16}/></span>
        </span>
        <span>Change photo</span>
      </button>

      <input
        ref={avatarInput}
        className="profile-hidden-file"
        name="avatar"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={event=>{
          const file=event.target.files?.[0];
          if(!file)return;
          setAvatarPreview(URL.createObjectURL(file));
          setRemoveAvatar(false);
          setAvatarMenuOpen(false);
        }}
      />
      {removeAvatar?<input type="hidden" name="remove_avatar" value="1"/>:null}

      {avatarMenuOpen?<div className="profile-picture-menu">
        <button type="button" onClick={()=>avatarInput.current?.click()}>Upload picture</button>
        {(avatarPreview||props.avatarUrl)?<button
          type="button"
          className="profile-remove-option"
          onClick={()=>{
            setAvatarPreview('');
            setRemoveAvatar(true);
            if(avatarInput.current)avatarInput.current.value='';
            setAvatarMenuOpen(false);
          }}
        >Remove current picture</button>:null}
      </div>:null}
    </div>

    <label>
      Username
      <input name="display_name" required minLength={2} maxLength={60} defaultValue={props.username} autoComplete="username"/>
      <small>This is the public name shown on your store.</small>
    </label>

    <label>
      Shop Description
      <textarea name="description" maxLength={300} rows={5} defaultValue={props.description} placeholder="Tell people what you sell or collect."/>
      <small>Maximum 300 characters.</small>
    </label>

    <label>
      Name <span className="profile-optional">(optional)</span>
      <input name="full_name" maxLength={100} defaultValue={props.fullName} autoComplete="name"/>
    </label>

    <label>
      Email
      <input value={props.email} readOnly disabled aria-describedby="profile-email-note"/>
      <small id="profile-email-note">This is the email used to create your account.</small>
    </label>

    <label>
      Phone number <span className="profile-optional">(optional)</span>
      <input name="phone" type="tel" maxLength={25} defaultValue={props.phone} autoComplete="tel" placeholder="+60 12-345 6789"/>
    </label>

    <label>
      Gender <span className="profile-optional">(optional)</span>
      <select name="gender" defaultValue={props.gender}>
        <option value="">Not selected</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
        <option value="Prefer not to say">Prefer not to say</option>
      </select>
    </label>

    <label>
      Date of birth <span className="profile-optional">(optional)</span>
      <input name="date_of_birth" type="date" defaultValue={props.dateOfBirth}/>
    </label>

    <div className="profile-private-note">Name, email, phone number, gender and date of birth stay private. Your public store shows only your username, shop description and profile picture.</div>

    {state.error?<div className="form-notice error" role="alert">{state.error}</div>:null}
    {state.message?<div className="form-notice" role="status">{state.message}</div>:null}

    <div className="profile-form-actions">
      <button className="button profile-save-button" type="submit" disabled={pending}>{pending?'Saving…':'Save profile'}</button>
      <button className="button profile-signout-button" type="submit" formAction={signOut} formNoValidate>Sign out</button>
    </div>
  </form>;
}
