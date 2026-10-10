import type { Product } from '@/data/products';

export const FEATURE_ROTATION_MS=60*60*1000;
export const FEATURE_NEW_BOOST_PRIORITY_MS=30*60*1000;
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

function rotatedBoosts(items:Product[],slot:number){
  if(items.length<=1)return [...items];
  const ordered=[...items].sort((a,b)=>{
    const aTime=Date.parse(a.boostedAt||'')||0;
    const bTime=Date.parse(b.boostedAt||'')||0;
    return bTime-aTime||a.id.localeCompare(b.id);
  });
  const offset=((slot%ordered.length)+ordered.length)%ordered.length;
  return [...ordered.slice(offset),...ordered.slice(0,offset)];
}

export function featuredProductsForTime(
  items:Product[],
  nowMs=Date.now(),
  limit=FEATURED_PRODUCT_LIMIT,
){
  const activeBoosts=items.filter(item=>{
    const until=Date.parse(item.boostedUntil||'');
    return Number.isFinite(until)&&until>nowMs;
  });

  const fresh:Product[]=[];
  const rotating:Product[]=[];

  for(const item of activeBoosts){
    const started=Date.parse(item.boostedAt||'');
    if(Number.isFinite(started)&&started>0&&nowMs-started<FEATURE_NEW_BOOST_PRIORITY_MS){
      fresh.push(item);
    }else{
      rotating.push(item);
    }
  }

  fresh.sort((a,b)=>{
    const aTime=Date.parse(a.boostedAt||'')||0;
    const bTime=Date.parse(b.boostedAt||'')||0;
    return bTime-aTime||a.id.localeCompare(b.id);
  });

  const slot=featureRotationSlot(nowMs);
  const rotated=rotatedBoosts(rotating,slot);

  return [...fresh,...rotated].slice(0,Math.max(0,limit));
}
