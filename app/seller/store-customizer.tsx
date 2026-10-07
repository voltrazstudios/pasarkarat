'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';
import { Crown, ImagePlus, Layers3, LockKeyhole, Plus, Trash2, Type, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { saveStoreCustomization, type StoreCustomizationResult } from './actions';
import { StoreBanner } from '@/components/store-banner';
import type { StoreSection, StoreSectionBlock } from '@/lib/sellers';
import { contrastText, darkenHexColor, defaultStoreTheme, storeFontFamily, type StoreFont, type StoreTheme } from '@/lib/store-theme';

type ProductOption={id:string;name:string};
type EditableSubcategory={key:string;type:'subcategory';title:string;productIds:string[]};
type EditableImage={key:string;type:'image';imagePath:string;preview:string};
type EditableBlock=EditableSubcategory|EditableImage;
type EditableSection={key:string;name:string;blocks:EditableBlock[]};
type StorePayloadBlock=
  | {type:'subcategory';title:string}
  | {type:'products';productIds:string[]}
  | {type:'image';imagePath:string};

function newKey(prefix:string){
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}

function storedBlockCount(blocks:EditableBlock[]){
  return blocks.reduce((total,block)=>total+(block.type==='subcategory'?2:1),0);
}

function storedBlockIndex(blocks:EditableBlock[],blockIndex:number){
  let rawIndex=0;
  for(let index=0;index<blockIndex;index++){
    rawIndex+=blocks[index].type==='subcategory'?2:1;
  }
  return rawIndex;
}

function editableBlocks(blocks:StoreSectionBlock[],allowedProductIds:Set<string>):EditableBlock[]{
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
          productIds:next.productIds.filter(id=>allowedProductIds.has(id)),
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
        productIds:block.productIds.filter(id=>allowedProductIds.has(id)),
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
  isPro,
  theme,
  featuredProductIds,
  customSlug,
}:{
  bannerUrl:string;
  initialSections:StoreSection[];
  products:ProductOption[];
  initialOpen?:boolean;
  sellerId:string;
  isPro:boolean;
  theme:StoreTheme;
  featuredProductIds:string[];
  customSlug:string;
}){
  const router=useRouter();
  const [open,setOpen]=useState(initialOpen);
  const [savedSinceOpen,setSavedSinceOpen]=useState(false);
  const [state,action,pending]=useActionState<StoreCustomizationResult,FormData>(saveStoreCustomization,{});
  const [bannerPreview,setBannerPreview]=useState(bannerUrl);
  const [removeBanner,setRemoveBanner]=useState(false);
  const allowedProductIds=new Set(products.map(product=>product.id));
  const [accentColor,setAccentColor]=useState(theme.accentColor);
  const [pageBackground,setPageBackground]=useState(theme.pageBackground);
  const [cardColor,setCardColor]=useState(theme.cardColor);
  const [storeFont,setStoreFont]=useState<StoreFont>(theme.font);
  const [featured,setFeatured]=useState<string[]>(featuredProductIds.filter(id=>allowedProductIds.has(id)));
  const [slug,setSlug]=useState(customSlug);
  const bannerInput=useRef<HTMLInputElement>(null);
  const [sections,setSections]=useState<EditableSection[]>(
    initialSections.map((section,index)=>({
      key:`saved-${index}-${section.name}`,
      name:section.name,
      blocks:editableBlocks(section.blocks,allowedProductIds),
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
    if(sections.length>=5)return;
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

  function toggleFeatured(productId:string,checked:boolean){
    setFeatured(current=>{
      if(!checked)return current.filter(id=>id!==productId);
      if(current.includes(productId)||current.length>=4)return current;
      return [...current,productId];
    });
  }

  function resetProTheme(){
    setAccentColor(defaultStoreTheme.accentColor);
    setPageBackground(defaultStoreTheme.pageBackground);
    setCardColor(defaultStoreTheme.cardColor);
    setStoreFont(defaultStoreTheme.font);
  }

  const sectionsPayload=sections.map(section=>({
    name:section.name,
    blocks:section.blocks.flatMap<StorePayloadBlock>(block=>{
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
      <input type="hidden" name="accent_color" value={accentColor}/>
      <input type="hidden" name="page_background" value={pageBackground}/>
      <input type="hidden" name="card_color" value={cardColor}/>
      <input type="hidden" name="store_font" value={storeFont}/>
      <input type="hidden" name="featured_product_ids" value={JSON.stringify(featured)}/>
      <input type="hidden" name="custom_slug" value={slug}/>

      <div className="store-customizer-heading">
        <div>
          <p className="eyebrow">YOUR STOREFRONT</p>
          <h2>Customize your shop</h2>
        </div>
        <button type="button" className="store-customizer-close" aria-label="Close customizer" onClick={closeCustomizer}><X size={20}/></button>
      </div>

      <div className="store-banner-control">
        <div className="store-banner-result-preview">
          <StoreBanner
            src={bannerPreview}
            emptyLabel="No banner yet"
          />
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
        <small>PNG, JPG or WebP · maximum 5 MB. Banner is centered automatically.</small>
      </div>

      <div className="store-pro-editor" data-locked={isPro?'false':'true'}>
        <div className="store-pro-heading">
          <div>
            <span className="store-pro-title"><Crown size={18}/> Pro storefront</span>
            <span>Colours, fonts, featured products and your custom shop URL.</span>
          </div>
          {isPro?<span className="store-pro-status">PRO ACTIVE</span>:<Link href="/pro" className="button store-pro-upgrade"><LockKeyhole size={15}/> Upgrade to Pro</Link>}
        </div>

        <fieldset disabled={!isPro} className="store-pro-fields">
          <div className="store-theme-controls">
            <label>Accent colour
              <span className="store-color-control"><input type="color" value={accentColor} onChange={event=>setAccentColor(event.target.value)}/><code>{accentColor}</code></span>
            </label>
            <label>Page background
              <span className="store-color-control"><input type="color" value={pageBackground} onChange={event=>setPageBackground(event.target.value)}/><code>{pageBackground}</code></span>
            </label>
            <label>Cards / boxes
              <span className="store-color-control"><input type="color" value={cardColor} onChange={event=>setCardColor(event.target.value)}/><code>{cardColor}</code></span>
            </label>
            <label>Store font
              <select value={storeFont} onChange={event=>setStoreFont(event.target.value as StoreFont)}>
                <option value="default">Pasar Karat Default</option>
                <option value="classic">Classic — Georgia</option>
                <option value="clean">Clean — Inter</option>
                <option value="modern">Modern — Manrope</option>
                <option value="vintage">Vintage — Lora</option>
                <option value="typewriter">Typewriter — Courier</option>
              </select>
            </label>
          </div>

          <div
            className="store-theme-live-preview"
            style={{background:pageBackground,color:contrastText(pageBackground),fontFamily:storeFontFamily(storeFont)}}
          >
            <span>Store preview</span>
            <div style={{background:cardColor,color:contrastText(cardColor),borderColor:darkenHexColor(cardColor)}}>
              <strong>Your shop identity</strong>
              <small>Text colour changes automatically for readability.</small>
              <button type="button" style={{background:accentColor,color:contrastText(accentColor)}}>Accent button</button>
            </div>
          </div>

          {isPro?<div className="store-pro-reset-row">
            <button type="button" className="store-pro-reset" onClick={resetProTheme}>Reset to default</button>
          </div>:null}

          <div className="store-featured-editor">
            <strong>Featured Products <span>{featured.length}/4</span></strong>
            <p>Choose up to four approved products to highlight on Home.</p>
            {products.length?<div className="store-featured-grid">{products.map(product=><label key={product.id}>
              <input type="checkbox" checked={featured.includes(product.id)} disabled={!featured.includes(product.id)&&featured.length>=4} onChange={event=>toggleFeatured(product.id,event.target.checked)}/>
              <span>{product.name}</span>
            </label>)}</div>:<p className="store-section-empty">Add an approved product first.</p>}
          </div>

          <label className="store-custom-url">
            Custom store URL
            <div><span>/shop/</span><input
              value={slug}
              minLength={3}
              maxLength={40}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              onChange={event=>setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,40))}
              placeholder="abc-shop"
            /></div>
            <small>3–40 characters · lowercase letters, numbers and hyphens.</small>
          </label>
        </fieldset>

        {!isPro?<div className="store-pro-lock-note"><LockKeyhole size={16}/> Your saved Free storefront stays unchanged. Upgrade only unlocks visual identity and Pro tools.</div>:null}
      </div>

      <div className="store-sections-editor">
        <div className="store-sections-title">
          <div>
            <strong>Store sections</strong>
            <span>Home and All Products are always included. Add up to 5 custom sections.</span>
          </div>
          <button type="button" className="button secondary" disabled={sections.length>=5} onClick={addSection}><Plus size={16}/> Add section</button>
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
                    name={`section_image_${sectionIndex}_${storedBlockIndex(section.blocks,blockIndex)}`}
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
