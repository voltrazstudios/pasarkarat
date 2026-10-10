'use client';

import { startTransition, useActionState, useState } from 'react';
import { categories, platformDisplayName, platforms, type Platform } from '@/data/products';
import { submitProductEdit } from './actions';

type ProductEditInput={
  id:string;
  name:string;
  description:string;
  minPrice:number;
  maxPrice:number;
  category:string;
  imageUrl:string|null;
  links:{platform:string;seller_url:string;affiliate_url:string|null}[];
};

export function ProductEditForm({product}:{product:ProductEditInput}){
  const initialPlatforms=product.links.map(link=>link.platform).filter((value):value is Platform=>platforms.includes(value as Platform));
  const [state,action,pending]=useActionState(submitProductEdit,{});
  const [selected,setSelected]=useState<Platform[]>(initialPlatforms);
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
    <input type="hidden" name="product_id" value={product.id}/>

    {product.imageUrl?<div className="edit-product-current-image">
      <img src={product.imageUrl} alt={product.name}/>
      <div><strong>Current public image</strong><span>Leave the new image field empty to keep this image.</span></div>
    </div>:null}

    <div className="form-grid">
      <label>Product name<input name="name" required minLength={2} maxLength={100} defaultValue={product.name}/></label>
      <div className="submission-price-range">
        <label>Minimum price (RM)<input name="min_price" required inputMode="decimal" pattern="\d{1,10}(\.\d{1,2})?" defaultValue={product.minPrice.toFixed(2)}/></label>
        <label>Maximum price (RM)<input name="max_price" required inputMode="decimal" pattern="\d{1,10}(\.\d{1,2})?" defaultValue={product.maxPrice.toFixed(2)}/></label>
        <small>Use the lowest and highest prices across your selected platforms.</small>
      </div>
    </div>

    <label>Category
      <select name="category" required defaultValue={product.category}>
        {categories.map(category=><option value={category} key={category}>{category}</option>)}
      </select>
    </label>

    <label>Description
      <textarea name="description" required minLength={10} maxLength={2000} rows={6} defaultValue={product.description}/>
      <small>Plain text only · maximum 2,000 characters</small>
    </label>

    <label>Replace product image <span className="profile-optional">(optional)</span>
      <input name="image" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"/>
      <small>Leave empty to keep the current image. PNG, JPG or WebP · maximum 5 MB.</small>
    </label>

    <fieldset className="platform-fieldset">
      <legend>Where is it available?</legend>
      <p>Update the platforms and links that should appear on the live product after approval.</p>
      {platforms.map(item=>{
        const active=selected.includes(item);
        const existing=product.links.find(link=>link.platform===item);
        return <div className="platform-submit-card" data-active={active} key={item}>
          <label className="platform-check">
            <input type="checkbox" name="platform" value={item} checked={active} onChange={event=>toggle(item,event.target.checked)}/>
            <strong>{platformDisplayName(item)}</strong>
          </label>
          <label>{item==='Own website'?'Seller website/product URL':`${platformDisplayName(item)} seller/product URL`}
            <input name={`seller_${item}`} type="url" required={active} disabled={!active} defaultValue={existing?.seller_url||''} placeholder="https://..."/>
          </label>
          <label>Affiliate URL <span>(optional)</span>
            <input name={`affiliate_${item}`} type="url" disabled={!active} defaultValue={existing?.affiliate_url||''} placeholder="https://..."/>
          </label>
        </div>;
      })}
    </fieldset>

    {(clientError||state.error)?<div className="form-notice error" role="alert">{clientError||state.error}</div>:null}
    <div className="submission-note">
      <strong>Your current product will not change yet.</strong>
      <span>These edits become public only after an administrator approves them.</span>
    </div>
    <button className="button submit-product-button" disabled={pending}>{pending?'Submitting edit…':'Submit edit for review'}</button>
  </form>;
}
