'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { syncSavedProducts } from '@/app/marketplace-actions';

const storageKey='pasar-karat-saved-items';
const visitorStorageKey='pasar-karat-visitor-id';
const validId=/^(?:[0-9]{1,8}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

function readIds(raw:string|null):string[]{
  try { const value:unknown=JSON.parse(raw??'[]'); return Array.isArray(value)?[...new Set(value.filter((id):id is string=>typeof id==='string'&&validId.test(id)))]:[]; }
  catch { return []; }
}

function visitorId(){
  try{
    const existing=localStorage.getItem(visitorStorageKey);
    if(existing&&uuid.test(existing))return existing;
    const created=crypto.randomUUID();
    localStorage.setItem(visitorStorageKey,created);
    return created;
  }catch{return crypto.randomUUID();}
}

const SavedContext=createContext<{ids:string[];ready:boolean;notice:string;toggle:(id:string)=>Promise<boolean>}|null>(null);

export function SavedItemsProvider({children}:{children:ReactNode}){
  const [ids,setIds]=useState<string[]>([]);
  const [ready,setReady]=useState(false);
  const [notice,setNotice]=useState('');
  const [visitor,setVisitor]=useState('');

  useEffect(()=>{
    let current:string[]=[];
    try{current=readIds(localStorage.getItem(storageKey));setIds(current);}catch{setNotice('Browser storage is unavailable. Saved finds will only last for this visit.');}
    const key=visitorId();
    setVisitor(key);
    setReady(true);
    void syncSavedProducts(current.filter(id=>uuid.test(id)),key);

    const sync=(event:StorageEvent)=>{
      if(event.storageArea===localStorage&&(event.key===storageKey||event.key===null)){
        const next=readIds(event.newValue);
        setIds(next);
        void syncSavedProducts(next.filter(id=>uuid.test(id)),key);
      }
    };
    window.addEventListener('storage',sync);
    return()=>window.removeEventListener('storage',sync);
  },[]);

  async function toggle(id:string){
    if(!ready||!validId.test(id))return false;
    let current=ids;
    try{if(!notice)current=readIds(localStorage.getItem(storageKey));}catch{/* Use this visit's state when storage cannot be read. */}
    const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];
    setIds(next);
    try{localStorage.setItem(storageKey,JSON.stringify(next));setNotice('');}catch{setNotice('Browser storage is unavailable. Saved finds will only last for this visit.');}
    if(visitor&&uuid.test(id)){
      await syncSavedProducts(next.filter(value=>uuid.test(value)),visitor);
      return true;
    }
    return false;
  }

  return <SavedContext.Provider value={{ids,ready,notice,toggle}}>{children}</SavedContext.Provider>;
}

export function useSavedItems(){const value=useContext(SavedContext);if(!value)throw new Error('SavedItemsProvider is required');return value;}

export function SaveButton({id,name}:{id:string;name:string}){
  const router=useRouter();
  const {ids,ready,toggle,notice}=useSavedItems();
  const saved=ids.includes(id);
  async function onToggle(){
    const tracked=await toggle(id);
    if(tracked)router.refresh();
  }
  return <div className="save-control"><button type="button" className="save-button" aria-pressed={saved} aria-label={`${saved?'Remove':'Save'} ${name}${saved?' from saved items':''}`} disabled={!ready} onClick={()=>void onToggle()}>{saved?'♥ Saved':'♡ Save'}</button>{notice&&<small role="status" className="save-notice">{notice}</small>}</div>;
}
