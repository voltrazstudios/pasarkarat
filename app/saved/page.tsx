import Link from 'next/link';
import { SavedCollection } from '@/components/saved-collection';
import { collectionProducts } from '@/lib/products';
import { configured, db } from '@/lib/supabase';

export const metadata={title:'Saved Items'};
export const dynamic='force-dynamic';

export default async function Page(){
  let signedIn=false;
  if(configured()){
    const client=await db();
    const {data:{user}}=await client.auth.getUser();
    signedIn=Boolean(user);
  }

  if(!signedIn){
    return <main id="main" className="container catalogue saved-page">
      <h1>Your Saved Finds</h1>
      <p className="intro">Keep track of the treasures that caught your eye.</p>
      <div className="empty-state saved-signin-state">
        <h2>Sign in to save your favourite finds</h2>
        <p>Your saved items are linked to your account, so you can access them again on any device.</p>
        <Link href="/auth?next=/saved" prefetch={false} className="button">Sign in to continue</Link>
      </div>
    </main>;
  }

  return <SavedCollection items={await collectionProducts()}/>;
}
