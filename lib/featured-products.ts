import type { Product } from '@/data/products';

export const FEATURE_ROTATION_MS=30*60*1000;
export const FEATURED_PRODUCT_LIMIT=12;

export function featureRotationSlot(time=Date.now()){
  return Math.floor(time/FEATURE_ROTATION_MS);
}

function seededRandom(seed:number){
  let value=(seed>>>0)||1;
  return ()=>{
    value=(value*1664525+1013904223)>>>0;
    return value/4294967296;
  };
}

function shuffled<T>(values:T[],seed:number){
  const result=[...values];
  const random=seededRandom(seed);
  for(let index=result.length-1;index>0;index--){
    const target=Math.floor(random()*(index+1));
    [result[index],result[target]]=[result[target],result[index]];
  }
  return result;
}

function fairRotation<T>(values:T[],slot:number){
  if(values.length<=1)return [...values];
  const firstIndex=((slot%values.length)+values.length)%values.length;
  const first=values[firstIndex];
  const rest=values.filter((_,index)=>index!==firstIndex);
  return [first,...shuffled(rest,slot+values.length*7919)];
}

export function featuredProductsForSlot(items:Product[],slot:number,limit=FEATURED_PRODUCT_LIMIT){
  const now=slot*FEATURE_ROTATION_MS;
  const boosted=items.filter(item=>item.boostedUntil&&new Date(item.boostedUntil).getTime()>now);
  const boostedIds=new Set(boosted.map(item=>item.id));
  const regular=items.filter(item=>!boostedIds.has(item.id));

  const orderedBoosted=fairRotation(boosted,slot);
  const orderedRegular=fairRotation(regular,slot);
  return [...orderedBoosted,...orderedRegular].slice(0,Math.max(0,limit));
}
