import { Catalogue } from '@/components/marketplace';
import { collectionProducts } from '@/lib/products';
export const metadata={title:'All Items'};
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{q?:string;category?:string}>}){
  const [p,items]=await Promise.all([searchParams,collectionProducts()]);
  return <Catalogue key={`${p.q??''}-${p.category??''}`} initialQuery={p.q} initialCategory={p.category} items={items}/>;
}
