import { Suspense } from 'react';
import { HeritageGallery } from '@/components/heritage-gallery';
import '../heritage/heritage.css';
import type { Metadata } from 'next';
import { ArrowUpRight, ArrowDown, Store, Sparkles, Compass } from 'lucide-react';
import { ProductImage } from '@/components/marketplace';
import { ExperienceVideo } from '@/components/experience-video';
import { experience } from '@/data/experience';
import './experience.css';

export const metadata:Metadata={title:'Virtual Experience',description:'Explore a digitally recreated Malaysian Pasar Karat through an interactive 3D heritage experience.'};
const features=[
  {icon:Store,title:'Explore the Market',text:'Walk through a detailed digital recreation of Pasar Karat and explore its stalls, objects and surroundings.'},
  {icon:Sparkles,title:'Discover Heritage',text:'Interact with traditional items and discover the stories and cultural significance behind them.'},
  {icon:Compass,title:'Interactive Experience',text:'Experience Malaysian market heritage through exploration, interaction and digital storytelling.'},
];
export default function ExperiencePage(){return <main id="main" className="experience-page">
  <section className="container experience-hero">
    <div className="experience-hero-copy"><p className="eyebrow"><span className="small-line"/> IMMERSIVE DIGITAL HERITAGE</p><h1>Step Into<br/><em>Pasar Karat</em></h1><p className="experience-lead">Explore a digitally recreated Malaysian Pasar Karat and discover its heritage, objects and atmosphere through an interactive 3D experience.</p><a className="button" href={experience.url} target="_blank" rel="noopener noreferrer">Experience on itch.io <ArrowUpRight size={19}/></a><a className="text-link experience-discover" href="#discover-experience">Discover the Experience <ArrowDown size={17}/></a></div>
    <div className="experience-hero-media"><ExperienceVideo key={experience.video} src={experience.video} poster={experience.poster}/><div className="experience-media-caption"><span>THE MARKET BEYOND THE SCREEN</span><span>Explore. Interact. Discover.</span></div></div>
  </section>
  <section className="container experience-intro" id="discover-experience"><div className="experience-intro-heading"><p className="eyebrow">A FAMILIAR PLACE. A NEW PERSPECTIVE.</p><h2>Explore Malaysia&apos;s<br/>Market Heritage in 3D</h2></div><p>Wander through a digital Pasar Karat, interact with heritage objects and experience the atmosphere of Malaysia&apos;s iconic flea-market culture in a virtual environment.</p></section>
  <section className="container experience-features" aria-label="Experience features">{features.map(({icon:Icon,title,text},i)=><article className="experience-feature" key={title}><div className="experience-feature-top"><span className="experience-feature-icon"><Icon size={25} strokeWidth={1.5}/></span><span className="experience-number">0{i+1}</span></div><h3>{title}</h3><p>{text}</p></article>)}</section>
  <Suspense fallback={<div className="container" role="status">Loading Heritage Gallery…</div>}><HeritageGallery/></Suspense>
  <section className="container experience-screenshots"><div className="section-heading"><div><p className="eyebrow">A WINDOW INTO THE VIRTUAL MARKET</p><h2>Inside the Experience</h2></div></div><p className="experience-section-copy">A glimpse of what you can explore in the virtual Pasar Karat.</p><div className="experience-screenshot-grid">{experience.screenshots.map((s,i)=><figure className="experience-shot" key={s.image}><ProductImage key={s.image} src={s.image} name={s.title}/><figcaption><span className="experience-shot-index">0{i+1}</span><div><h3>{s.title}</h3><p>{s.caption}</p></div></figcaption></figure>)}</div></section>
  <section className="container experience-story"><div><p className="eyebrow">THE OBJECTS. THE ATMOSPHERE. THE STORIES.</p><h2>More Than<br/>a Marketplace</h2><span className="experience-story-rule" aria-hidden="true"/></div><p>Pasar Karat Digital Heritage brings the atmosphere and cultural identity of Pasar Karat into an interactive digital environment. The experience allows visitors to explore, interact and discover heritage in a way that complements the real-world marketplace.</p></section>
  <section className="container experience-cta"><div><p className="eyebrow">READY TO EXPLORE PASAR KARAT?</p><h2>Experience the Market.<br/>Keep the Stories Alive.</h2><p className="experience-cta-copy">Explore the Pasar Karat virtual experience and discover Malaysia&apos;s market heritage in an interactive digital environment.</p></div><div className="experience-cta-action"><a className="button" href={experience.url} target="_blank" rel="noopener noreferrer">Visit the Virtual Experience <ArrowUpRight size={19}/></a><span>Opens on itch.io in a new tab</span></div></section>
</main>;}

