'use client';

import { startTransition, useActionState, useState } from 'react';
import { categories, platformDisplayName, platforms, type Platform } from '@/data/products';
import { submitProduct } from './actions';

export function ProductSubmissionForm(){
  const [state,action,pending]=useActionState(submitProduct,{});
  const [selected,setSelected]=useState<Platform[]>([]);
  const [listingType,setListingType]=useState<'normal'|'rare_limited'>('normal');
  const [auctionEnabled,setAuctionEnabled]=useState(false);
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
    <fieldset className="listing-type-fieldset">
      <legend>Listing type</legend>
      <p>Choose how this item should appear in Pasar Karat.</p>
      <div className="listing-type-options">
        <label className={listingType==='normal'?'listing-type-card selected':'listing-type-card'}>
          <input type="radio" name="listing_type" value="normal" checked={listingType==='normal'} onChange={()=>{setListingType('normal');setAuctionEnabled(false);}}/>
          <strong>Normal</strong>
          <span>Standard marketplace listing with product details and external seller links.</span>
        </label>
        <label className={listingType==='rare_limited'?'listing-type-card rare selected':'listing-type-card rare'}>
          <input type="radio" name="listing_type" value="rare_limited" checked={listingType==='rare_limited'} onChange={()=>setListingType('rare_limited')}/>
          <strong>Rare &amp; Limited</strong>
          <span>For one-off, hard-to-find, collectible or limited items with a deeper story.</span>
        </label>
      </div>
    </fieldset>

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
      <textarea name="description" required minLength={10} maxLength={2000} rows={6} placeholder="Describe the item, condition and anything buyers should know."/>
      <small>Plain text only · maximum 2,000 characters</small>
    </label>

    <label>Product image
      <input name="image" type="file" required accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"/>
      <small>PNG, JPG or WebP · maximum 5 MB. Images are decoded and re-encoded before storage.</small>
    </label>

    {listingType==='rare_limited'?<section className="rare-submission-builder">
      <div className="rare-builder-heading">
        <span className="rare-limited-badge">Rare &amp; Limited</span>
        <div><h2>Tell the story behind this piece</h2><p>This becomes a magazine-style story below the buying area on the product page.</p></div>
      </div>

      <label>Story title
        <input name="story_title" required minLength={3} maxLength={120} placeholder="e.g. A Wau Bulan carried through three generations"/>
      </label>

      <label>Story / essay
        <textarea name="story_text" required minLength={100} maxLength={12000} rows={12} placeholder="Tell its origin, history, maker, previous owner, cultural significance, condition, restoration, or why this piece is difficult to find."/>
        <small>100–12,000 characters · paragraphs are preserved.</small>
      </label>

      <label>Story images <span className="profile-optional">(optional)</span>
        <input name="story_images" type="file" multiple accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"/>
        <small>Up to 6 images · maximum 5 MB each.</small>
      </label>

      <label>Story video <span className="profile-optional">(optional)</span>
        <input name="story_video_url" type="url" placeholder="https://www.youtube.com/watch?v=..."/>
        <small>YouTube or Vimeo link.</small>
      </label>

      <div className="rare-certificate-fields">
        <h3>Certificate / provenance <span>(if applicable)</span></h3>
        <label>Certificate title
          <input name="certificate_title" maxLength={120} placeholder="e.g. Certificate of Authenticity"/>
        </label>
        <label>Certificate details
          <textarea name="certificate_details" maxLength={3000} rows={5} placeholder="Issuer, reference number, maker, date, provenance or authentication notes."/>
        </label>
        <label>Certificate image
          <input name="certificate_image" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"/>
          <small>Optional image of the certificate · maximum 5 MB.</small>
        </label>
      </div>

      <div className="auction-builder">
        <label className="auction-enable-row">
          <input type="checkbox" name="auction_enabled" checked={auctionEnabled} onChange={event=>setAuctionEnabled(event.target.checked)}/>
          <span><strong>Enable bidding</strong><small>Run an auction directly on this Rare &amp; Limited listing.</small></span>
        </label>

        {auctionEnabled?<div className="auction-fields">
          <label>Starting bid (RM)
            <input name="auction_starting_bid" required inputMode="decimal" pattern="\d{1,10}(\.\d{1,2})?" placeholder="100.00"/>
          </label>
          <label>Minimum bid increase (RM)
            <input name="auction_min_increment" required inputMode="decimal" pattern="\d{1,10}(\.\d{1,2})?" placeholder="5.00"/>
          </label>
          <label>Auction duration (hours)
            <input name="auction_duration_hours" required type="number" min={1} max={168} step={1} defaultValue={24}/>
          </label>
          <p className="auction-timing-note">The auction starts when an administrator approves the listing. Minimum 1 hour · maximum 7 days.</p>
        </div>:null}
      </div>
    </section>:null}

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
      <span>Your product, story, media and auction setup stay private until an administrator approves them.</span>
    </div>
    <button className="button submit-product-button" disabled={pending}>{pending?'Submitting for review…':'Submit for review'}</button>
  </form>;
}
