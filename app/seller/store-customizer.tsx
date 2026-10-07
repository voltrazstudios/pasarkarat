'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { ImagePlus, Plus, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { saveStoreCustomization, type StoreCustomizationResult } from './actions';
import type { StoreSection } from '@/lib/sellers';

type ProductOption={id:string;name:string};
type EditableSection={key:string;name:string;productIds:string[]};

export function StoreCustomizer({
  bannerUrl,
  initialSections,
  products,
}:{
  bannerUrl:string;
  initialSections:StoreSection[];
  products:ProductOption[];
}){
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [state,action,pending]=useActionState<StoreCustomizationResult,FormData>(saveStoreCustomization,{});
  const [bannerPreview,setBannerPreview]=useState(bannerUrl);
  const [removeBanner,setRemoveBanner]=useState(false);
  const bannerInput=useRef<HTMLInputElement>(null);
  const [sections,setSections]=useState<EditableSection[]>(
    initialSections.map((section,index)=>({
      key:`saved-${index}-${section.name}`,
      name:section.name,
      productIds:section.productIds,
    }))
  );

  useEffect(()=>{
    if(!state.message)return;
    router.refresh();
  },[state.message,router]);

  function addSection(){
    if(sections.length>=3)return;
    setSections(current=>[
      ...current,
      {key:`new-${Date.now()}-${current.length}`,name:'',productIds:[]},
    ]);
  }

  function updateSection(index:number,patch:Partial<EditableSection>){
    setSections(current=>current.map((section,i)=>i===index?{...section,...patch}:section));
  }

  return <section className="store-customizer">
    <button type="button" className="button secondary store-customize-trigger" onClick={()=>setOpen(value=>!value)} aria-expanded={open}>
      <SlidersHorizontal size={17}/>{open?'Close Customizer':'Customize Store'}
    </button>

    {open?<form action={action} className="store-customizer-panel">
      <div className="store-customizer-heading">
        <div>
          <p className="eyebrow">YOUR STOREFRONT</p>
          <h2>Customize your shop</h2>
        </div>
        <button type="button" className="store-customizer-close" aria-label="Close customizer" onClick={()=>setOpen(false)}><X size={20}/></button>
      </div>

      <div className="store-banner-control">
        <div className="store-banner-editor-preview">
          {bannerPreview?<img src={bannerPreview} alt="Shop banner preview"/>:<div><ImagePlus size={28}/><span>No banner yet</span></div>}
        </div>
        <div className="store-banner-editor-actions">
          <button type="button" className="button secondary" onClick={()=>bannerInput.current?.click()}>{bannerPreview?'Change banner':'Upload banner'}</button>
          {bannerPreview?<button type="button" className="store-remove-button" onClick={()=>{
            setBannerPreview('');
            setRemoveBanner(true);
            if(bannerInput.current)bannerInput.current.value='';
          }}>Remove banner</button>:null}
        </div>
        <input
          ref={bannerInput}
          className="profile-hidden-file"
          name="banner"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={event=>{
            const file=event.target.files?.[0];
            if(!file)return;
            setBannerPreview(URL.createObjectURL(file));
            setRemoveBanner(false);
          }}
        />
        {removeBanner?<input type="hidden" name="remove_banner" value="1"/>:null}
        <small>PNG, JPG or WebP · maximum 5 MB. Recommended wide image.</small>
      </div>

      <div className="store-sections-editor">
        <div className="store-sections-title">
          <div>
            <strong>Store sections</strong>
            <span>Home and All Products are always included. Add up to 3 more sections.</span>
          </div>
          <button type="button" className="button secondary" disabled={sections.length>=3} onClick={addSection}><Plus size={16}/> Add section</button>
        </div>

        {sections.length?sections.map((section,index)=><article className="store-section-editor" key={section.key}>
          <div className="store-section-editor-top">
            <label>
              Section name
              <input
                name={`section_name_${index}`}
                value={section.name}
                minLength={2}
                maxLength={40}
                required
                onChange={event=>updateSection(index,{name:event.target.value})}
                placeholder="e.g. Vintage Audio"
              />
            </label>
            <button type="button" className="store-section-delete" aria-label={`Remove section ${index+1}`} onClick={()=>setSections(current=>current.filter((_,i)=>i!==index))}><Trash2 size={17}/></button>
          </div>

          <fieldset>
            <legend>Products in this section</legend>
            {products.length?<div className="store-section-product-list">{products.map(product=>{
              const checked=section.productIds.includes(product.id);
              return <label key={product.id}>
                <input
                  type="checkbox"
                  name={`section_product_${index}`}
                  value={product.id}
                  checked={checked}
                  onChange={event=>updateSection(index,{
                    productIds:event.target.checked
                      ? [...new Set([...section.productIds,product.id])]
                      : section.productIds.filter(id=>id!==product.id),
                  })}
                />
                <span>{product.name}</span>
              </label>;
            })}</div>:<p className="store-section-empty">You need an approved product before assigning products to a custom section.</p>}
          </fieldset>
        </article>):<p className="store-section-empty">No custom sections yet. Your store still has Home and All Products.</p>}
      </div>

      {state.error?<div className="form-notice error" role="alert">{state.error}</div>:null}
      {state.message?<div className="form-notice" role="status">{state.message}</div>:null}
      <button className="button store-customizer-save" disabled={pending}>{pending?'Saving store…':'Save Store'}</button>
    </form>:null}
  </section>;
}
