import { notFound } from 'next/navigation';
import { heritageObjects } from '@/data/heritage';
import { HeritageStory } from '@/components/heritage-gallery';
import '../heritage.css';
export const metadata={title:'Heritage Story'};
export function generateStaticParams(){return heritageObjects.map(o=>({id:o.id}));}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!heritageObjects.some(o=>o.id===id))notFound();return <HeritageStory id={id}/>;}
