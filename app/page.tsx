import { Home } from '@/components/marketplace';
import { collectionProducts } from '@/lib/products';
import { featuredStores } from '@/lib/sellers';
import { activeAds } from '@/lib/ads';

export const dynamic='force-dynamic';

export default async function Page(){
  const [items,stores,ads]=await Promise.all([collectionProducts(),featuredStores(),activeAds()]);
  return <Home items={items} featuredStores={stores} ads={ads} initialFeaturedTime={Date.now()}/>;
}
