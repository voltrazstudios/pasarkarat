import { FloralBackground } from '@/components/floral-background';
import { Lora, Source_Sans_3 } from 'next/font/google';
import { MalaysiaSideOverlay } from '@/components/malaysia-side-overlay';
import { SavedItemsProvider } from '@/components/saved-items';
import { LanguageProvider } from '@/components/language-provider';
import type { Metadata } from 'next';
import './globals.css';
import './responsive.css';
import './theme.css';
import './multi-seller.css';

const headingFont = Lora({ subsets: ['latin'], display: 'swap', variable: '--font-heading' });
const bodyFont = Source_Sans_3({ subsets: ['latin'], display: 'swap', variable: '--font-body' });

import { Header, Footer } from '@/components/marketplace';

export const metadata: Metadata = {
  title: { default:'Pasar Karat — Digital Marketplace', template:'%s | Pasar Karat' },
  description:'Discover vintage items, traditional crafts and collectibles from independent sellers.',
  icons:{icon:'/favicon.svg'}
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
    <body style={{ isolation: 'isolate', position: 'relative' }}>
      <FloralBackground/>
      <MalaysiaSideOverlay/>
      <a className="skip-link" href="#main">Skip to content</a>
      <LanguageProvider>
        <SavedItemsProvider>
          <Header/>
          {children}
          <Footer/>
        </SavedItemsProvider>
      </LanguageProvider>
    </body>
  </html>;
}
