import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import { StoreBanner } from '@/components/store-banner';
import { collectionProducts } from '@/lib/products';
import { sellerProductMetrics, sellerSections, sellerSummary } from '@/lib/sellers';
import { defaultStoreTheme, storeThemeVariables } from '@/lib/store-theme';
import { SellerStorefrontShell } from './storefront-shell';

export type StorePageQuery={error?:string;section?:string;customize?:string};

export async function SellerStorePage({id,query}:{id:string;query:StorePageQuery}){
  const [seller,allProducts,sections,metrics]=await Promise.all([
    sellerSummary(id),
    collectionProducts(),
    sellerSections(id),
    sellerProductMetrics(id),
  ]);
  if(!seller)notFound();

  const products=allProducts.filter(product=>product.sellerId===seller.id);
  const requested=query.section||'home';
  const customSection=sections.find(section=>section.name===requested)||null;
  const active=requested==='all'?'all':customSection?customSection.name:'home';
  const customizing=seller.isOwner&&query.customize==='1';
  const theme=seller.isPro
    ? {
        accentColor:seller.accentColor,
        pageBackground:seller.pageBackground,
        cardColor:seller.cardColor,
        font:seller.storeFont,
      }
    : defaultStoreTheme;
  const style=storeThemeVariables(theme) as CSSProperties;

  return <main id="main" className={`container seller-page seller-store-themed${seller.isPro?' seller-store-pro':''}`} style={style}>
    {query.error?<div className="form-notice error" role="alert">{query.error==='follow'?'Unable to update your follow right now. Please try again.':'Seller features are unavailable right now.'}</div>:null}

    <StoreBanner src={seller.bannerUrl||''}/>

    <SellerStorefrontShell
      seller={seller}
      sections={sections}
      products={products}
      metrics={metrics}
      initialActive={active}
      customizing={customizing}
    />
  </main>;
}
