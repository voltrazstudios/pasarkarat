import { SavedCollection } from '@/components/saved-collection';
import { collectionProducts } from '@/lib/products';
export const metadata={title:'Saved Items'};
export const dynamic='force-dynamic';
export default async function Page(){return <SavedCollection items={await collectionProducts()}/>;}
