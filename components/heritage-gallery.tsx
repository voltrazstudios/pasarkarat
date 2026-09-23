'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { heritageObjects } from '@/data/heritage';
import { ProductImage } from './marketplace';
const storageKey='pasar-karat-heritage-discoveries';
const knownIds=new Set(heritageObjects.map(o=>o.id));
function readDiscoveries(){try{const data:unknown=JSON.parse(localStorage.getItem(storageKey)??'[]');return Array.isArray(data)?[...new Set(data.filter((id):id is string=>typeof id==='string'&&knownIds.has(id)))]:[];}catch{return [];}}
function useDiscoveries(){const [ids,setIds]=useState<string[]>([]);const [ready,setReady]=useState(false);useEffect(()=>{setIds(readDiscoveries());setReady(true);const sync=()=>setIds(readDiscoveries());window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);return {ids,setIds,ready};}
export function HeritageGallery(){
 const {ids,setIds,ready}=useDiscoveries();const params=useSearchParams();const [notice,setNotice]=useState<{title:string;body?:string}|null>(null);
 useEffect(()=>{
  const url=new URL(window.location.href);
  if(!url.searchParams.has('discover')&&!url.searchParams.has('key'))return;
  const id=url.searchParams.get('discover');const key=url.searchParams.get('key');
  const item=heritageObjects.find(o=>o.id===id&&o.claimKey===key);
  const current=readDiscoveries();
  if(!item)setNotice({title:'Discovery code not recognized.'});
  else if(current.includes(item.id)){setIds(current);setNotice({title:'Already Discovered',body:`${item.name} is already in your Heritage Gallery.`});}
  else{try{const next=[...current,item.id];localStorage.setItem(storageKey,JSON.stringify(next));setIds(next);setNotice({title:'Heritage Discovered!',body:`${item.name} has been added to your Heritage Gallery.`});}catch{setNotice({title:'Discovery could not be saved.',body:'Allow browser storage, then open the discovery link again.'});}}
  url.searchParams.delete('discover');url.searchParams.delete('key');url.hash='heritage-gallery';
  window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);
  const frame=requestAnimationFrame(()=>document.getElementById('heritage-gallery')?.scrollIntoView({block:'start'}));
  return()=>cancelAnimationFrame(frame);
 },[params,setIds]);
 return <section id="heritage-gallery" className="container heritage-gallery"><div className="section-heading"><div><p className="eyebrow">HERITAGE DISCOVERY COLLECTION</p><h2>Your Heritage Gallery</h2></div><span className="heritage-progress" role="status">{ready?ids.length:'…'} / {heritageObjects.length} Discovered</span></div><p className="heritage-intro">Discover heritage objects inside the virtual Pasar Karat to unlock their stories here.</p>{notice&&<div className="heritage-notice" role="status"><strong>{notice.title}</strong>{notice.body&&<p>{notice.body}</p>}</div>}<div className="heritage-grid">{heritageObjects.map((item,i)=>{const unlocked=ids.includes(item.id);return <article className="heritage-card" key={item.id}>{unlocked?<><ProductImage src={item.image} name={item.name}/><div className="heritage-card-body"><span className="heritage-status">✓ Discovered</span><h3>{item.name}</h3><p>{item.shortDescription}</p><Link className="text-link" href={`/heritage/${item.id}`}>Discover Its Story →</Link></div></>:<><div className="heritage-mystery" aria-hidden="true"><span className="heritage-slot">{String(i+1).padStart(2,'0')}</span><span>???</span></div><div className="heritage-card-body"><h3>Undiscovered</h3><p>Find this heritage object inside the Virtual Experience.</p></div></>}</article>;})}</div></section>;
}
export function HeritageStory({id}:{id:string}){const {ids,ready}=useDiscoveries();const item=heritageObjects.find(o=>o.id===id)!;return <main id="main" className="container heritage-detail"><Link href="/experience#heritage-gallery" className="text-link back">← Your Heritage Gallery</Link>{!ready?<p role="status">Loading discovery…</p>:!ids.includes(id)?<div className="empty-state"><h1>Undiscovered</h1><p>Find this heritage object inside the Virtual Experience.</p><Link className="button" href="/experience#heritage-gallery">Explore the Virtual Experience</Link></div>:<div className="heritage-story-layout"><ProductImage src={item.image} name={item.name}/><div><p className="eyebrow">✓ Discovered</p><h1>{item.name}</h1><p className="heritage-summary">{item.shortDescription}</p><p>{item.story}</p></div></div>}</main>;}
