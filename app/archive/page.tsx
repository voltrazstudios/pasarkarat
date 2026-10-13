import { ArchiveBrowser } from '@/components/archive';
import { activeAds } from '@/lib/ads';
import './archive.css';

export const metadata={title:'Malaysian Digital Archive',description:"Discover Malaysia's objects, food, traditions, places and stories."};
export const dynamic='force-dynamic';

export default async function Page(){
  const ads=await activeAds();
  return <ArchiveBrowser ads={ads}/>;
}
