'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { products } from '@/data/products';

const storageKey='pasar-karat-saved-items';
const validIds=new Set(products.map(p=>p.id));
function readIds(raw:string|null):string[]{
  try { const value:unknown=JSON.parse(raw??'[]'); return Array.isArray(value)?[...new Set(value.filter((id):id is string=>typeof id==='string'&&validIds.has(id)))]:[]; }
  catch { return []; }
}
const SavedContext=createContext<{ids:string[];ready:boolean;notice:string;toggle:(id:string)=>void}|null>(null);
export function SavedItemsProvider({children}:{children:ReactNode}){
  const [ids,setIds]=useState<string[]>([]);
  const [ready,setReady]=useState(false);
  const [notice,setNotice]=useState('');
  useEffect(()=>{
    try{setIds(readIds(localStorage.getItem(storageKey)));}catch{setNotice('Browser storage is unavailable. Saved finds will only last for this visit.');}
    setReady(true);
    const sync=(event:StorageEvent)=>{if(event.storageArea===localStorage&&(event.key===storageKey||event.key===null))setIds(readIds(event.newValue));};
    window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
  },[]);
  function toggle(id:string){
    if(!ready||!validIds.has(id))return;
    let current=ids;
    try{if(!notice)current=readIds(localStorage.getItem(storageKey));}catch{/* Use this visit's state when storage cannot be read. */}
    const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];
    setIds(next);
    try{localStorage.setItem(storageKey,JSON.stringify(next));setNotice('');}catch{setNotice('Browser storage is unavailable. Saved finds will only last for this visit.');}
  }
  return <SavedContext.Provider value={{ids,ready,notice,toggle}}>{children}</SavedContext.Provider>;
}
export function useSavedItems(){const value=useContext(SavedContext);if(!value)throw new Error('SavedItemsProvider is required');return value;}
export function SaveButton({id,name}:{id:string;name:string}){
  const {ids,ready,toggle,notice}=useSavedItems();const saved=ids.includes(id);
  return <div className="save-control"><button type="button" className="save-button" aria-pressed={saved} aria-label={`${saved?'Remove':'Save'} ${name}${saved?' from saved items':''}`} disabled={!ready} onClick={()=>toggle(id)}>{saved?'♥ Saved':'♡ Save'}</button>{notice&&<small role="status" className="save-notice">{notice}</small>}</div>;
}

