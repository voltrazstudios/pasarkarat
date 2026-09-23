import Link from 'next/link';
export default function NotFound(){return <main id="main" className="container empty-state"><p className="eyebrow">404 · NOT FOUND</p><h1>This find has wandered off.</h1><p>Explore the collection for another discovery.</p><Link className="button" href="/items">Back to collection →</Link></main>;}
