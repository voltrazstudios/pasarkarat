'use client';
import { useState } from 'react';
import { Play, Film } from 'lucide-react';

export function ExperienceVideo({src,poster}:{src:string;poster:string}) {
  const [failed,setFailed]=useState(false);
  return <div className="experience-video">
    {src&&!failed ? <video controls playsInline preload="metadata" poster={poster||undefined} onError={()=>setFailed(true)} aria-label="Pasar Karat gameplay preview"><source src={src}/>Your browser does not support this video.</video> : <div className="experience-video-placeholder">
      <div className="experience-video-grid" aria-hidden="true"/>
      <span className="experience-media-label"><Film size={15}/> VIRTUAL EXPERIENCE PREVIEW</span>
      <div className="experience-play-wrap"><button className="experience-play" disabled aria-label="Gameplay preview unavailable"><Play size={30} fill="currentColor" strokeWidth={1.5}/></button><p>Step inside a different kind of market.</p><span>{failed?'Preview unavailable. Please check back later.':'Gameplay preview coming soon'}</span></div>
      <span className="experience-media-foot">PASAR KARAT <span>DIGITAL HERITAGE</span></span>
    </div>}
  </div>;
}
