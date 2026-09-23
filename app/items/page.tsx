import { Catalogue } from '@/components/marketplace';
export const metadata={title:'All Items'};
export default async function Page({searchParams}:{searchParams:Promise<{q?:string;category?:string}>}){const p=await searchParams;return <Catalogue key={`${p.q??''}-${p.category??''}`} initialQuery={p.q} initialCategory={p.category}/>;}
