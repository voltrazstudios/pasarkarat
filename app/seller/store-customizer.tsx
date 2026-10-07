'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { ImagePlus, Layers3, PackageSearch, Plus, Trash2, Type, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { saveStoreCustomization, type StoreCustomizationResult } from './actions';
import type { StoreSection, StoreSectionBlock } from '@/lib/sellers';

type ProductOption={id:string;name:string};
type EditableSubcategory={key:string;type:'subcategory';title:string};
type EditableProducts={key:string;type:'products';productIds:string[]};
type EditableImage={key:string;type:'image';imagePath:string;preview:string};
type EditableBlock=EditableSubcategory|EditableProducts|EditableImage;
type EditableSection={key:string;name:string;blocks:EditableBlock[]};

function newKey(prefix:string){
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}

function editableBlock(block:StoreSectionBlock,index:number):EditableBlock{
  if(block.type==='subcategory')return {key:`saved-subcategory-${index}`,type:'subcategory',title:block.title};
  if(block.type==='products')return {key:`saved-products-${index}`,type:'products',productIds:block.productIds};
  return {key:`saved-image-${index}`,type:'image',imagePath:block.imagePath,preview:block.imageUrl};
}

export function StoreCustomizer({
  bannerUrl,
  initialSections,
  products,
  initialOpen=false,
  sellerId,
}:{
  bannerUrl:string;
  initialSections:StoreSection[];
  products:ProductOption[];
  initialOpen?:boolean;
  sellerId:string;
}){
  const router=useRouter();
  const [open,setOpen]=useState(initialOpen);
  const [savedSinceOpen,setSavedSinceOpen]=useState(false);
  const [state,action,pending]=useActionState<StoreCustomizationResult,FormData>(saveStoreCustomization,{});
  const [bannerPreview,setBannerPreview]=useState(bannerUrl);
  const [removeBanner,setRemoveBanner]=useState(false);
  const bannerInput=useRef<HTMLInputElement>(null);
  const [sections,setSections]=useState<EditableSection[]>(
    initialSections.map((section,index)=>({
      key:`saved-${index}-${section.name}`,
      name:section.name,
      blocks:section.blocks.map((block,blockIndex)=>editableBlock(block,blockIndex)),
    }))
  );

  useEffect(()=>{
    if(initialOpen)setOpen(true);
  },[initialOpen]);

  useEffect(()=>{
    if(!state.message)return;
    setSavedSinceOpen(true);
    if(state.imagePaths){
      setSections(current=>current.map((section,sectionIndex)=>({
        ...section,
        blocks:section.blocks.map((block,blockIndex)=>{
          if(block.type!=='image')return block;
          const savedPath=state.imagePaths?.[sectionIndex]?.[blockIndex];
          return savedPath?{...block,imagePath:savedPath}:block;
        }),
      })));
    }
  },[state.message,state.imagePaths]);

  function closeCustomizer(){
    setOpen(false);
    router.replace(`/seller/${sellerId}`,{scroll:false});
    if(savedSinceOpen)router.refresh();
  }

  function addSection(){
    if(sections.length>=3)return;
    setSections(current=>[...current,{key:newKey('section'),name:'',blocks:[]}]);
  }

  function updateSection(index:number,patch:Partial<EditableSection>){
    setSections(current=>current.map((section,i)=>i===index?{...section,...patch}:section));
  }

  function updateBlock(sectionIndex:number,blockIndex:number,patch:Record<string,unknown>){
    setSections(current=>current.map((section,sIndex)=>{
      if(sIndex!==sectionIndex)return section;
      return {
        ...section,
        blocks:section.blocks.map((block,bIndex)=>bIndex===blockIndex?{...block,...patch} as EditableBlock:block),
      };
    }));
  }

  function addBlock(sectionIndex:number,type:EditableBlock['type']){
    setSections(current=>current.map((section,index)=>{
      if(index!==sectionIndex||section.blocks.length>=12)return section;
      const block:EditableBlock=
        type==='subcategory'
          ? {key:newKey('subcategory'),type:'subcategory',title:''}
          : type==='products'
            ? {key:newKey('products'),type:'products',productIds:[]}
            : {key:newKey('image'),type:'image',imagePath:'',preview:''};
      return {...section,blocks:[...section.blocks,block]};
    }));
  }

  function removeBlock(sectionIndex:number,blockIndex:number){
    setSections(current=>current.map((section,index)=>index===sectionIndex
      ? {...section,blocks:section.blocks.filter((_,i)=>i!==blockIndex)}
      : section
    ));
  }

  const sectionsPayload=sections.map(section=>({
    name:section.name,
    blocks:section.blocks.map(block=>{
      if(block.type==='subcategory')return {type:block.type,title:block.title};
      if(block.type==='products')return {type:block.type,productIds:block.productIds};
      return {type:block.type,imagePath:block.imagePath};
    }),
  }));

  if(!open)return null;

  return <section className="store-customizer" id="customize-store">
    <form action={action} className="store-customizer-panel">
      <input type="hidden" name="sections_json" value={JSON.stringify(sectionsPayload)}/>

      <div className="store-customizer-heading">
        <div>
          <p className="eyebrow">YOUR STOREFRONT</p>
          <h2>Customize your shop</h2>
        </div>
        <button type="button" className="store-customizer-close" aria-label="Close customizer" onClick={closeCustomizer}><X size={20}/></button>
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
            <span>Home and All Products are always included. Add up to 3 custom sections.</span>
          </div>
          <button type="button" className="button secondary" disabled={sections.length>=3} onClick={addSection}><Plus size={16}/> Add section</button>
        </div>

        {sections.length?sections.map((section,sectionIndex)=><article className="store-section-editor" key={section.key}>
          <div className="store-section-editor-top">
            <label>
              Section name
              <input
                value={section.name}
                minLength={2}
                maxLength={40}
                required
                onChange={event=>updateSection(sectionIndex,{name:event.target.value})}
                placeholder="e.g. Vintage Audio"
              />
            </label>
            <button type="button" className="store-section-delete" aria-label={`Remove section ${sectionIndex+1}`} onClick={()=>setSections(current=>current.filter((_,i)=>i!==sectionIndex))}><Trash2 size={17}/></button>
          </div>

          <div className="store-content-blocks">
            {section.blocks.map((block,blockIndex)=><div className="store-content-block-editor" data-type={block.type} key={block.key}>
              <div className="store-content-block-heading">
                <strong>{block.type==='subcategory'?'Subcategory':block.type==='products'?'Show products':'Image'}</strong>
                <button type="button" aria-label="Remove content block" onClick={()=>removeBlock(sectionIndex,blockIndex)}><Trash2 size={15}/></button>
              </div>

              {block.type==='subcategory'?<label>
                Subcategory title
                <input
                  value={block.title}
                  maxLength={60}
                  required
                  onChange={event=>updateBlock(sectionIndex,blockIndex,{title:event.target.value})}
                  placeholder="e.g. Turntables"
                />
              </label>:null}

              {block.type==='products'?(
                products.length?<div className="store-section-product-list">{products.map(product=>{
                  const checked=block.productIds.includes(product.id);
                  return <label key={product.id}>
                    <input
                      type="checkbox"
                      value={product.id}
                      checked={checked}
                      onChange={event=>updateBlock(sectionIndex,blockIndex,{
                        productIds:event.target.checked
                          ? [...new Set([...block.productIds,product.id])]
                          : block.productIds.filter(id=>id!==product.id),
                      })}
                    />
                    <span>{product.name}</span>
                  </label>;
                })}</div>:<p className="store-section-empty">You need an approved product before using a product block.</p>
              ):null}

              {block.type==='image'?<div className="store-section-image-editor">
                <div className="store-section-image-preview">
                  {block.preview?<img src={block.preview} alt="Section image preview"/>:<div><ImagePlus size={22}/><span>Choose an image</span></div>}
                </div>
                <label className="button secondary store-section-image-button">
                  {block.preview?'Change image':'Choose image'}
                  <input
                    className="profile-hidden-file"
                    name={`section_image_${sectionIndex}_${blockIndex}`}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={event=>{
                      const file=event.target.files?.[0];
                      if(!file)return;
                      updateBlock(sectionIndex,blockIndex,{preview:URL.createObjectURL(file),imagePath:''});
                    }}
                  />
                </label>
                <small>PNG, JPG or WebP · maximum 5 MB.</small>
              </div>:null}
            </div>)}

            {section.blocks.length<12?<div className="store-add-block-row">
              <span>Add content</span>
              <button type="button" onClick={()=>addBlock(sectionIndex,'subcategory')}><Type size={15}/> Subcategory</button>
              <button type="button" onClick={()=>addBlock(sectionIndex,'products')}><PackageSearch size={15}/> Show products</button>
              <button type="button" onClick={()=>addBlock(sectionIndex,'image')}><ImagePlus size={15}/> Image</button>
            </div>:<p className="store-section-empty">This section has reached the 12-block limit.</p>}
          </div>
        </article>):<p className="store-section-empty">No custom sections yet. Your store still has Home and All Products.</p>}
      </div>

      {state.error?<div className="form-notice error" role="alert">{state.error}</div>:null}
      {state.message?<div className="form-notice" role="status">{state.message}</div>:null}
      <div className="store-customizer-footer">
        <button className="button store-customizer-save" disabled={pending}>{pending?'Saving store…':'Save Store'}</button>
        <span><Layers3 size={15}/> Your selected products stay checked after saving.</span>
      </div>
    </form>
  </section>;
}
