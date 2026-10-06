'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useSavedItems } from './saved-items';
import { useLanguage } from './language-provider';
import { LanguageFlag } from './language-flag';
import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';

const links=[
  ['Home','/'],
  ['Collection','/items'],
  ['Archive','/archive'],
  ['Virtual Experience','/experience'],
  ['SEN','/sen'],
  ['About','/about'],
  ['Saved','/saved']
];

export function Header({isAdmin=false}:{isAdmin?:boolean}){
  const {ids}=useSavedItems();
  const {language,toggleLanguage}=useLanguage();
  const [open,setOpen]=useState(false);
  const toggle=useRef<HTMLButtonElement>(null);
  const languageButton=useRef<HTMLButtonElement>(null);
  const navigation=useRef<HTMLElement>(null);
  const header=useRef<HTMLElement>(null);

  useEffect(()=>{
    const query=window.matchMedia('(max-width: 900px)');
    let focusFrame=0;
    let previousOverflow='';

    const closeMenu=(restoreFocus=false)=>{
      setOpen(false);
      if(restoreFocus) requestAnimationFrame(()=>toggle.current?.focus());
    };

    const onKey=(e:KeyboardEvent)=>{
      if(e.key==='Escape'&&open){
        e.preventDefault();
        closeMenu(true);
        return;
      }

      if(e.key==='Tab'&&open){
        const menuLinks=Array.from(navigation.current?.querySelectorAll<HTMLElement>('a[href]')??[]);
        const focusables=[toggle.current,...menuLinks,languageButton.current].filter((item):item is HTMLElement=>Boolean(item));
        if(!focusables.length)return;

        const first=focusables[0];
        const last=focusables[focusables.length-1];

        if(e.shiftKey&&document.activeElement===first){
          e.preventDefault();
          last.focus();
        }else if(!e.shiftKey&&document.activeElement===last){
          e.preventDefault();
          first.focus();
        }
      }
    };

    const onPointer=(e:PointerEvent)=>{
      if(open&&!header.current?.contains(e.target as Node))closeMenu();
    };

    const onResize=()=>{
      if(!query.matches)closeMenu();
    };

    if(open&&query.matches){
      previousOverflow=document.body.style.overflow;
      document.body.style.overflow='hidden';
      focusFrame=requestAnimationFrame(()=>{
        navigation.current?.querySelector<HTMLElement>('a[href]')?.focus();
      });
    }

    document.addEventListener('keydown',onKey);
    document.addEventListener('pointerdown',onPointer);
    query.addEventListener('change',onResize);

    return ()=>{
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown',onKey);
      document.removeEventListener('pointerdown',onPointer);
      query.removeEventListener('change',onResize);
      if(open)document.body.style.overflow=previousOverflow;
    };
  },[open]);

  return <>
    <div className="topline">Old treasures. New discoveries. <span>A little piece of Malaysia, wherever you are.</span></div>
    <header className="header" ref={header} onBlur={e=>{if(open&&!e.currentTarget.contains(e.relatedTarget as Node))setOpen(false);}}>
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Pasar Karat home" onClick={()=>setOpen(false)}>
          <Image sizes="(max-width: 600px) 200px, (max-width: 900px) 220px, 240px" className="brand-logo" src="/pasar-karat-logo.png" width={1200} height={300} alt="Pasar Karat"/>
        </Link>
        <button ref={toggle} type="button" className="mobile-menu-toggle" aria-label={open?'Close navigation menu':'Open navigation menu'} aria-expanded={open} aria-controls="main-navigation" onClick={()=>setOpen(!open)}>
          {open?<X size={24}/>:<Menu size={24}/>}
        </button>
        <nav ref={navigation} id="main-navigation" aria-label="Main navigation" data-open={open}>
          {links.map(([label,href])=><Link key={href} href={href} onClick={()=>setOpen(false)}>{label}{href==="/saved"&&<span className="saved-count">{ids.length}</span>}</Link>)}
          {isAdmin?<Link className="site-admin-link" href="/admin" onClick={()=>setOpen(false)}>Admin</Link>:null}
        </nav>
        <button ref={languageButton} type="button" className="language-toggle" onClick={toggleLanguage} aria-label={language==="en"?"Switch to Bahasa Melayu":"Switch to English"} title={language==="en"?"Bahasa Melayu":"English"}>
          <LanguageFlag country={language==="en"?"my":"gb"}/>
        </button>
      </div>
    </header>
  </>;
}
