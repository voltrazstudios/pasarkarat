import { BadgeCheck, BookOpenText, Images, PlayCircle } from 'lucide-react';
import type { Product } from '@/data/products';
import { storyVideoEmbedUrl } from '@/lib/rare-listing';

export function RareProductStory({product}:{product:Product}){
  if(product.listingType!=='rare_limited'||!product.storyText)return null;
  const embed=storyVideoEmbedUrl(product.storyVideoUrl);

  return <section className="rare-story-section">
    <div className="rare-story-intro">
      <span className="rare-limited-badge">Rare &amp; Limited</span>
      <p className="eyebrow"><BookOpenText size={15}/> THE STORY BEHIND THE PIECE</p>
      <h2>{product.storyTitle||'A piece with a story'}</h2>
      <p className="rare-story-copy">{product.storyText}</p>
    </div>

    {product.storyImageUrls?.length?<div className="rare-story-media">
      <div className="rare-story-media-label"><Images size={18}/><strong>Story gallery</strong></div>
      <div className="rare-story-gallery">
        {product.storyImageUrls.map((src,index)=><figure key={src}><img src={src} alt={`${product.name} story image ${index+1}`}/></figure>)}
      </div>
    </div>:null}

    {embed?<div className="rare-story-video">
      <div className="rare-story-media-label"><PlayCircle size={18}/><strong>Watch the story</strong></div>
      <div className="rare-story-video-frame">
        <iframe
          src={embed}
          title={`${product.name} story video`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>:null}

    {(product.certificateTitle||product.certificateDetails||product.certificateImageUrl)?<div className="rare-certificate-card">
      <div className="rare-certificate-heading"><BadgeCheck size={23}/><div><p className="eyebrow">CERTIFICATE / PROVENANCE</p><h3>{product.certificateTitle||'Supporting provenance'}</h3></div></div>
      {product.certificateDetails?<p>{product.certificateDetails}</p>:null}
      {product.certificateImageUrl?<a href={product.certificateImageUrl} target="_blank" rel="noopener noreferrer" className="rare-certificate-image"><img src={product.certificateImageUrl} alt={product.certificateTitle||'Certificate or provenance document'}/></a>:null}
    </div>:null}
  </section>;
}
