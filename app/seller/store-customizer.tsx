'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { ImagePlus, Layers3, Plus, Trash2, Type, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { saveStoreCustomization, type StoreCustomizationResult } from './actions';
import type { StoreSection, StoreSectionBlock } from '@/lib/sellers';

type ProductOption={id:string;name:string};
type EditableSubcategory={key:string;type:'subcategory';title:string;productIds:string[]};
type EditableImage={key:string;type:'image';imagePath:string;preview:string};
type EditableBlock=EditableSubcategory|EditableImage;
type EditableSection={key:string;name:string;blocks:EditableBlock[]};

function newKey(prefix:string){
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}

function storedBlockCount(blocks:EditableBlock[]){
  return blocks.reduce((total,block)=>total+(block.type==='subcategory'?2:1),0);
}

function editableBlocks(blocks:StoreSectionBlock[]):EditableBlock[]{
  const result:EditableBlock[]=[];

  for(let index=0;index<blocks.length;index++){
    const block=blocks[index];

    if(block.type==='subcategory'){
      const next=blocks[index+1];
      if(next?.type==='products'){
        result.push({
          key:`saved-subcategory-${index}`,
          type:'subcategory',
          title:block.title,
          productIds:next.productIds,
        });
        index++;
      }else{
        result.push({
          key:`saved-subcategory-${index}`,
          type:'subcategory',
          title:block.title,
          productIds:[],
        });
      }
      continue;
    }

    if(block.type==='products'){
      result.push({
        key:`saved-products-${index}`,
        type:'subcategory',
        title:'Products',
        productIds:block.productIds,
      });
      continue;
    }

    result.push({
      key:`saved-image-${index}`,
      type:'image',
      imagePath:block.imagePath,
      preview:block.imageUrl,
    });
  }

  return result;
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
      blocks:editableBlocks(section.blocks),
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
          let rawIndex=0;
          for(let index=0;index<blockIndex;index++){
            rawIndex+=section.blocks[index].type==='subcategory'?2:1;
          }
          const savedPath=state.imagePaths?.[sectionIndex]?.[rawIndex];
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
      if(index!==sectionIndex)return section;
      const cost=type==='subcategory'?2:1;
      if(storedBlockCount(section.blocks)+cost>12)return section;
      const block:EditableBlock=
        type==='subcategory'
          ? {key:newKey('subcategory'),type:'subcategory',title:'',productIds:[]}
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
    blocks:section.blocks.flatMap(block=>{
      if(block.type==='subcategory'){
        return [
          {type:'subcategory',title:block.title},
          {type:'products',productIds:block.productIds},
        ];
      }
      return [{type:'image',imagePath:block.imagePath}];
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
                <strong>{block.type==='subcategory'?'Sub Category':'Image'}</strong>
                <button type="button" aria-label="Remove content block" onClick={()=>removeBlock(sectionIndex,blockIndex)}><Trash2 size={15}/></button>
              </div>

              {block.type==='subcategory'?<>
                <label>
                  Sub Category name
                  <input
                    value={block.title}
                    maxLength={60}
                    required
                    onChange={event=>updateBlock(sectionIndex,blockIndex,{title:event.target.value})}
                    placeholder="e.g. Turntables"
                  />
                </label>
                <div className="store-subcategory-products">
                  <strong>Products</strong>
                  {products.length?<div className="store-section-product-list">{products.map(product=>{
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
                  })}</div>:<p className="store-section-empty">You need an approved product before adding products to this Sub Category.</p>}
                </div>
              </>:null}

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

            {storedBlockCount(section.blocks)<12?<div className="store-add-block-row">
              <span>Add content</span>
              <button type="button" disabled={storedBlockCount(section.blocks)>10} onClick={()=>addBlock(sectionIndex,'subcategory')}><Type size={15}/> Sub Category</button>
              <button type="button" onClick={()=>addBlock(sectionIndex,'image')}><ImagePlus size={15}/> Image</button>
            </div>:<p className="store-section-empty">This section has reached the content limit.</p>}
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
