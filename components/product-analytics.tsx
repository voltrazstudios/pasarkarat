'use client';

import { useEffect, useRef } from 'react';
import type { Platform } from '@/data/products';
import { recordPlatformClick, recordProductView } from '@/app/items/analytics-actions';

const VISITOR_KEY='pasar-karat-product-analytics-visitor';

function visitorId(){
  let value=localStorage.getItem(VISITOR_KEY);
  if(!value){
    value=crypto.randomUUID().replace(/-/g,'');
    localStorage.setItem(VISITOR_KEY,value);
  }
  return value;
}

export function ProductViewTracker({productId}:{productId?:string|null}){
  const sent=useRef(false);

  useEffect(()=>{
    if(!productId||sent.current)return;
    sent.current=true;
    try{void recordProductView(productId,visitorId());}catch{}
  },[productId]);

  return null;
}

export function trackProductPlatformClick(productId:string|undefined,platform:Platform){
  if(!productId)return;
  try{void recordPlatformClick(productId,platform,visitorId());}catch{}
}
