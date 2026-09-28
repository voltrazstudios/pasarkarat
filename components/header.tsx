'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useSavedItems } from './saved-items';
import { useLanguage } from './language-provider';
import { LanguageFlag } from './language-flag';
import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';

const links=[['Home','/'],['Collection','/items'],['Archive','/archive'],['Virtual Experience','/experience'],['About','/about'],['Saved','/saved']];
export function Header(){
  const {ids}=useSavedItems();
  const {language,toggleLanguage}=useLanguage();
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
  return <><div className="topline">Old treasures. New discoveries. <span>A little piece of Malaysia, wherever you are.</span></div><header className="header" ref={header} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOpen(false);}}><div className="container header-inner"><Link href="/" className="brand" aria-label="Pasar Karat home" onClick={()=>setOpen(false)}><Image sizes="(max-width: 600px) 200px, (max-width: 900px) 220px, 240px" className="brand-logo" src="/pasar-karat-logo.png" width={1200} height={300} alt="Pasar Karat"/></Link><button ref={toggle} type="button" className="mobile-menu-toggle" aria-label={open?'Close navigation menu':'Open navigation menu'} aria-expanded={open} aria-controls="main-navigation" onClick={()=>setOpen(!open)}>{open?<X size={24}/>:<Menu size={24}/>}</button><nav id="main-navigation" aria-label="Main navigation" data-open={open}>{links.map(([label,href])=><Link key={href} href={href} onClick={()=>{setOpen(false);if(open)toggle.current?.focus();}}>{label}{href==="/saved"&&<span className="saved-count">{ids.length}</span>}</Link>)}</nav><button type="button" className="language-toggle" onClick={toggleLanguage} aria-label={language==="en"?"Switch to Bahasa Melayu":"Switch to English"} title={language==="en"?"Bahasa Melayu":"English"}><LanguageFlag country={language==="en"?"my":"gb"}/></button></div></header></>;
}





