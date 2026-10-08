import type { Product } from '@/data/products';

export function formatPriceRange(min:number,max:number,currency:'MYR'='MYR'){
  const format=new Intl.NumberFormat('en-MY',{style:'currency',currency});
  return min===max?format.format(min):`${format.format(min)} – ${format.format(max)}`;
}

export function productPriceLabel(product:Pick<Product,'price'|'minPrice'|'maxPrice'|'currency'>){
  const min=product.minPrice??product.price;
  if(min==null)return null;
  const max=product.maxPrice??min;
  return formatPriceRange(min,max,product.currency??'MYR');
}
