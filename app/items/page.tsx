import { Catalogue } from '@/components/marketplace';
import { collectionProducts } from '@/lib/products';

export const metadata={title:'All Items'};
export const dynamic='force-dynamic';

export default async function Page({searchParams}:{searchParams:Promise<{q?:string;category?:string;featured?:string}>}){
  const [p,items]=await Promise.all([searchParams,collectionProducts()]);
  const featured=p.featured==='1';
  return <Catalogue
    key={`${p.q??''}-${p.category??''}-${featured?'featured':'all'}`}
    initialQuery={p.q}
    initialCategory={p.category}
    initialFeatured={featured}
    initialFeaturedTime={Date.now()}
    items={items}
  />;
}
