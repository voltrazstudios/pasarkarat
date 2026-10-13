'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ActiveAd } from '@/lib/ads';

function smoothWeightedSchedule(ads:ActiveAd[]){
  if(!ads.length)return [] as ActiveAd[];
  const total=ads.reduce((sum,ad)=>sum+Math.max(1,Math.round(ad.weight)),0);
  const current=new Map<string,number>();
  const schedule:ActiveAd[]=[];

  for(let step=0;step<total;step++){
    let chosen=ads[0];
    let chosenScore=-Infinity;

    for(const ad of ads){
      const next=(current.get(ad.id)||0)+Math.max(1,Math.round(ad.weight));
      current.set(ad.id,next);
      if(next>chosenScore){
        chosen=ad;
        chosenScore=next;
      }
    }

    current.set(chosen.id,(current.get(chosen.id)||0)-total);
    schedule.push(chosen);
  }

  return schedule;
}

export function AdBannerRotator({ads}:{ads:ActiveAd[]}){
  const schedule=useMemo(()=>smoothWeightedSchedule(ads),[ads]);
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

  return <section className="container marketplace-ad-section" aria-label="Sponsored advertisement">
    <div className="marketplace-ad-label-row">
      <span>Sponsored</span>
      <Link href="/advertise">Advertise here</Link>
    </div>
    <a
      className="marketplace-ad-banner"
      href={ad.destinationUrl}
      target="_blank"
      rel="noopener noreferrer sponsored nofollow"
      aria-label={`Sponsored: ${ad.title}`}
      key={ad.id}
    >
      <picture>
        <source media="(max-width: 700px)" srcSet={ad.mobileImage}/>
        <img src={ad.desktopImage} alt={ad.title}/>
      </picture>
    </a>
    {ads.length>1?<div className="marketplace-ad-dots" aria-hidden="true">
      {ads.map(item=><span key={item.id} className={item.id===ad.id?'active':''}/>)}
    </div>:null}
  </section>;
}
