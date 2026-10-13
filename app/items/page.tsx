import { Catalogue } from '@/components/marketplace';
import { collectionProducts } from '@/lib/products';
import { activeAds } from '@/lib/ads';

export const metadata={title:'All Items'};
export const dynamic='force-dynamic';

export default async function Page({searchParams}:{searchParams:Promise<{q?:string;category?:string;featured?:string;rare?:string}>}){
  const [p,items,ads]=await Promise.all([searchParams,collectionProducts(),activeAds()]);
  const featured=p.featured==='1';
  const rare=p.rare==='1';
  return <Catalogue
    key={`${p.q??''}-${p.category??''}-${featured?'featured':rare?'rare':'all'}`}
    initialQuery={p.q}
    initialCategory={p.category}
    initialFeatured={featured}
    initialRare={rare}
    initialFeaturedTime={Date.now()}
    items={items}
    ads={ads}
  />;
}
