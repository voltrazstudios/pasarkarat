import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
export const dynamic='force-dynamic';
export default async function AdminLayout({children}:{children:React.ReactNode}){
  await requireAdmin();
  return <section className="market-admin-shell"><div className="container market-admin-toolbar"><strong>Private admin</strong><nav aria-label="Admin navigation"><Link href="/admin">Pending products</Link><Link href="/items">Collection</Link><Link href="/submit-product">Submit product</Link></nav></div>{children}</section>;
}
