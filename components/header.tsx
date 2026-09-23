'use client';
import Link from 'next/link';
import { useSavedItems } from './saved-items';
import { useEffect, useRef, useState } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';

const links=[['Home','/'],['Collection','/items'],['Archive','/archive'],['Virtual Experience','/experience'],['About','/about'],['Saved','/saved']];
export function Header(){
  const {ids}=useSavedItems();
  const [open,setOpen]=useState(false);
  const toggle=useRef<HTMLButtonElement>(null);
  const header=useRef<HTMLElement>(null);
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'&&open){setOpen(false);toggle.current?.focus();}};
    const onPointer=(e:PointerEvent)=>{if(open&&!header.current?.contains(e.target as Node))setOpen(false);};
    const query=window.matchMedia('(max-width: 900px)');
    const onResize=()=>{if(!query.matches)setOpen(false);};
    document.addEventListener('keydown',onKey);document.addEventListener('pointerdown',onPointer);query.addEventListener('change',onResize);
    return ()=>{document.removeEventListener('keydown',onKey);document.removeEventListener('pointerdown',onPointer);query.removeEventListener('change',onResize);};
  },[open]);
  return <><div className="topline">Old treasures. New discoveries. <span>A little piece of Malaysia, wherever you are.</span></div><header className="header" ref={header} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOpen(false);}}><div className="container header-inner"><Link href="/" className="brand" aria-label="Pasar Karat home" onClick={()=>setOpen(false)}><img className="brand-logo" src="/pasar-karat-logo.png" width={1200} height={300} alt="Pasar Karat"/></Link><button ref={toggle} type="button" className="mobile-menu-toggle" aria-label={open?'Close navigation menu':'Open navigation menu'} aria-expanded={open} aria-controls="main-navigation" onClick={()=>setOpen(!open)}>{open?<X size={24}/>:<Menu size={24}/>}</button><nav id="main-navigation" aria-label="Main navigation" data-open={open}>{links.map(([label,href])=><Link key={href} href={href} onClick={()=>{setOpen(false);if(open)toggle.current?.focus();}}>{label}{href==="/saved"&&<span className="saved-count">{ids.length}</span>}</Link>)}</nav><span className="header-note">Curated with character <Sparkles size={16}/></span></div></header></>;
}





