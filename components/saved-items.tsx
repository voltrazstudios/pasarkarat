'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAccountSavedIds, toggleAccountSavedProduct } from '@/app/marketplace-actions';

const validId=/^(?:[0-9]{1,8}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;

type SavedContextValue={
  ids:string[];
  ready:boolean;
  signedIn:boolean;
  notice:string;
  toggle:(id:string)=>Promise<boolean>;
};

const SavedContext=createContext<SavedContextValue|null>(null);

export function SavedItemsProvider({children}:{children:ReactNode}){
  const pathname=usePathname();
  const [ids,setIds]=useState<string[]>([]);
  const [ready,setReady]=useState(false);
  const [signedIn,setSignedIn]=useState(false);
  const [notice,setNotice]=useState('');

  useEffect(()=>{
    let active=true;
    setReady(false);

    try{
      localStorage.removeItem('pasar-karat-saved-items');
      localStorage.removeItem('pasar-karat-visitor-id');
    }catch{}

    void getAccountSavedIds().then(result=>{
      if(!active)return;
      setSignedIn(result.signedIn);
      setIds(result.signedIn?result.ids:[]);
      setNotice('');
      setReady(true);
    }).catch(()=>{
      if(!active)return;
      setSignedIn(false);
      setIds([]);
      setNotice('Saved finds are unavailable right now.');
      setReady(true);
    });

    return()=>{active=false;};
  },[pathname]);

  async function toggle(id:string){
    if(!ready||!signedIn||!validId.test(id))return false;

    const wasSaved=ids.includes(id);
    setIds(current=>wasSaved?current.filter(value=>value!==id):[...current,id]);

    const result=await toggleAccountSavedProduct(id);
    if(!result.signedIn){
      setSignedIn(false);
      setIds([]);
      return false;
    }
    if(result.error){
      setIds(current=>wasSaved?[...new Set([...current,id])]:current.filter(value=>value!==id));
      setNotice('Unable to update Saved right now. Please try again.');
      return false;
    }

    setIds(current=>result.saved?[...new Set([...current,id])]:current.filter(value=>value!==id));
    setNotice('');
    return true;
  }

  return <SavedContext.Provider value={{ids,ready,signedIn,notice,toggle}}>{children}</SavedContext.Provider>;
}

export function useSavedItems(){
  const value=useContext(SavedContext);
  if(!value)throw new Error('SavedItemsProvider is required');
  return value;
}

export function SaveButton({id,name}:{id:string;name:string}){
  const router=useRouter();
  const pathname=usePathname();
  const {ids,ready,signedIn,toggle,notice}=useSavedItems();
  const saved=ids.includes(id);

  async function onToggle(){
    if(!signedIn){
      const next=pathname||'/items';
      router.push(`/auth?next=${encodeURIComponent(next)}`);
      return;
    }
    const changed=await toggle(id);
    if(changed)router.refresh();
  }

  return <div className="save-control">
    <button
      type="button"
      className="save-button"
      aria-pressed={signedIn?saved:false}
      aria-label={signedIn?`${saved?'Remove':'Save'} ${name}${saved?' from saved items':''}`:`Sign in to save ${name}`}
      disabled={!ready}
      onClick={()=>void onToggle()}
    >
      {signedIn&&saved?'♥ Saved':'♡ Save'}
    </button>
    {notice&&<small role="status" className="save-notice">{notice}</small>}
  </div>;
}
