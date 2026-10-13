'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ActiveArchiveAd } from '@/lib/archive-ads';
import { ProductCard } from '@/components/marketplace';

function weightedSchedule(ads:ActiveArchiveAd[]){
  if(!ads.length)return [] as ActiveArchiveAd[];
  const total=ads.reduce((sum,ad)=>sum+Math.max(1,Math.round(ad.weight)),0);
  const score=new Map<string,number>();
  const schedule:ActiveArchiveAd[]=[];

  for(let step=0;step<total;step++){
    let chosen=ads[0];
    let best=-Infinity;
    for(const ad of ads){
      const next=(score.get(ad.id)||0)+Math.max(1,Math.round(ad.weight));
      score.set(ad.id,next);
      if(next>best){
        best=next;
        chosen=ad;
      }
    }
    score.set(chosen.id,(score.get(chosen.id)||0)-total);
    schedule.push(chosen);
  }
  return schedule;
}

export function ArchiveProductAd({
  archiveName,
  ads,
}:{
  archiveName:string;
  ads:ActiveArchiveAd[];
}){
  const schedule=useMemo(()=>weightedSchedule(ads),[ads]);
  const [turn,setTurn]=useState(0);

  useEffect(()=>{
    if(schedule.length<=1)return;
    const update=()=>setTurn(Math.floor(Date.now()/8000));
    update();
    const timer=window.setInterval(update,1000);
    return()=>window.clearInterval(timer);
  },[schedule.length]);

  if(!schedule.length)return null;
  const ad=schedule[turn%schedule.length]||schedule[0];

  return <section className="archive-sponsored-section" aria-label={`Sponsored products for ${archiveName}`}>
    <div className="archive-sponsored-heading">
      <div><p className="eyebrow">SPONSORED PRODUCT</p><h2>Shop {archiveName}</h2><p>Relevant seller listings promoted specifically for this Archive entry.</p></div>
      <Link href="/archive-ads" className="text-link">Promote a product here →</Link>
    </div>
    <div className="archive-sponsored-card"><ProductCard product={ad.product}/></div>
    {ads.length>1?<div className="archive-sponsored-dots" aria-hidden="true">
      {ads.map(item=><span key={item.id} className={item.id===ad.id?'active':''}/>)}
    </div>:null}
  </section>;
}
