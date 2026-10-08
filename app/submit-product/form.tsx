'use client';

import { startTransition, useActionState, useState } from 'react';
import { categories, platformDisplayName, platforms, type Platform } from '@/data/products';
import { submitProduct } from './actions';

export function ProductSubmissionForm(){
  const [state,action,pending]=useActionState(submitProduct,{});
  const [selected,setSelected]=useState<Platform[]>([]);
  const [clientError,setClientError]=useState('');

  function toggle(value:Platform,checked:boolean){
    setSelected(current=>checked?[...new Set([...current,value])]:current.filter(item=>item!==value));
    setClientError('');
  }

  function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!selected.length){
      setClientError('Choose at least one selling platform.');
      return;
    }
    setClientError('');
    const data=new FormData(event.currentTarget);
    startTransition(()=>action(data));
  }

  return <form onSubmit={submit} className="market-form submission-form">
    <div className="form-grid">
      <label>Product name<input name="name" required minLength={2} maxLength={100} placeholder="e.g. Vintage enamel tray"/></label>
      <div className="submission-price-range">
        <label>Minimum price (RM)<input name="min_price" required inputMode="decimal" pattern="\d{1,10}(\.\d{1,2})?" placeholder="25.00"/></label>
        <label>Maximum price (RM)<input name="max_price" required inputMode="decimal" pattern="\d{1,10}(\.\d{1,2})?" placeholder="40.00"/></label>
        <small>Use the lowest and highest prices across your selected platforms. If they are the same, enter the same amount twice.</small>
      </div>
    </div>

    <label>Category
      <select name="category" required defaultValue="">
        <option value="" disabled>Choose a category</option>
        {categories.map(category=><option value={category} key={category}>{category}</option>)}
      </select>
    </label>

    <label>Description
      <textarea name="description" required minLength={10} maxLength={2000} rows={6} placeholder="Describe the item, condition, story or anything buyers should know."/>
      <small>Plain text only · maximum 2,000 characters</small>
    </label>

    <label>Product image
      <input name="image" type="file" required accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"/>
      <small>PNG, JPG or WebP · maximum 5 MB. Images are decoded and re-encoded before storage.</small>
    </label>

    <fieldset className="platform-fieldset">
      <legend>Where is it available?</legend>
      <p>Select at least one platform, then add the product or seller link.</p>
      {platforms.map(item=>{
        const active=selected.includes(item);
        return <div className="platform-submit-card" data-active={active} key={item}>
          <label className="platform-check">
            <input type="checkbox" name="platform" value={item} checked={active} onChange={e=>toggle(item,e.target.checked)}/>
            <strong>{platformDisplayName(item)}</strong>
          </label>
          <label>{item==='Own website'?'Seller website/product URL':`${platformDisplayName(item)} seller/product URL`}
            <input name={`seller_${item}`} type="url" required={active} disabled={!active} placeholder="https://..."/>
          </label>
          <label>Affiliate URL <span>(optional)</span>
            <input name={`affiliate_${item}`} type="url" disabled={!active} placeholder="https://..."/>
          </label>
        </div>;
      })}
    </fieldset>

    {(clientError||state.error)&&<div className="form-notice error" role="alert">{clientError||state.error}</div>}
    <div className="submission-note">
      <strong>Every submission is reviewed first.</strong>
      <span>Your product stays private until an administrator approves it.</span>
    </div>
    <button className="button submit-product-button" disabled={pending}>{pending?'Submitting for review…':'Submit for review'}</button>
  </form>;
}
