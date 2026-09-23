import { SavedItemsProvider } from '@/components/saved-items';
import type { Metadata } from 'next';
import './globals.css';
import './responsive.css';
import { Header, Footer } from '@/components/marketplace';
export const metadata: Metadata = { title: { default:'Pasar Karat — Digital Marketplace', template:'%s | Pasar Karat' }, description:'Discover vintage items, traditional crafts and collectibles from independent sellers.', icons:{icon:'/favicon.svg'} };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><SavedItemsProvider><Header/>{children}<Footer/></SavedItemsProvider></body></html>; }


