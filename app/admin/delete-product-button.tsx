'use client';

import { useState } from 'react';
import { deletePublishedProduct } from './actions';

export function DeleteProductButton({id,name}:{id:string;name:string}){
  const [confirming,setConfirming]=useState(false);

  if(!confirming){
    return <button type="button" className="button secondary delete-product-trigger" onClick={()=>setConfirming(true)}>Delete</button>;
  }

  return <div className="delete-confirm">
    <span>Delete “{name}” permanently?</span>
    <form action={deletePublishedProduct}>
      <input type="hidden" name="id" value={id}/>
      <button className="button delete-product-confirm" type="submit">Delete permanently</button>
    </form>
    <button type="button" className="button secondary" onClick={()=>setConfirming(false)}>Cancel</button>
  </div>;
}
