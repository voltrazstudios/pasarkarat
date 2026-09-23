'use client';
import Link from 'next/link';
import { products } from '@/data/products';
import { ProductCard } from './marketplace';
import { useSavedItems } from './saved-items';
export function SavedCollection(){
  const {ids,ready,notice}=useSavedItems();const saved=products.filter(p=>ids.includes(p.id));
  return <main id="main" className="container catalogue saved-page"><h1>Your Saved Finds</h1><p className="intro">Keep track of the treasures that caught your eye.</p>{notice&&<p className="save-notice" role="status">{notice}</p>}{!ready?<p role="status" className="saved-loading">Loading saved finds…</p>:saved.length?<><p className="results-meta" role="status">{saved.length} saved {saved.length===1?'find':'finds'}</p><div className="product-grid">{saved.map(p=><ProductCard key={p.id} product={p}/>)}</div></>:<div className="empty-state"><h2>No saved finds yet</h2><p>Explore the collection and save the treasures you&apos;d like to revisit.</p><Link href="/items" className="button">Explore Collection</Link></div>}</main>;
}
