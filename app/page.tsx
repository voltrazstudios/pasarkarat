import { Home } from '@/components/marketplace';
import { collectionProducts } from '@/lib/products';
import { featuredStores } from '@/lib/sellers';

export const dynamic='force-dynamic';

export default async function Page(){
  const [items,stores]=await Promise.all([collectionProducts(),featuredStores()]);
  return <Home items={items} featuredStores={stores} initialFeaturedTime={Date.now()}/>;
}
