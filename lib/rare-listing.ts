export type ListingType='normal'|'rare_limited';

export function normalizeStoryVideoUrl(value:string){
  const trimmed=value.trim();
  if(!trimmed)return null;
  try{
    const url=new URL(trimmed);
    if(url.protocol!=='https:')return null;
    const host=url.hostname.toLowerCase().replace(/^www[.]/,'');
    if(host==='youtu.be'||host==='youtube.com'||host.endsWith('.youtube.com')||host==='vimeo.com'||host.endsWith('.vimeo.com')){
      return url.toString();
    }
    return null;
  }catch{
    return null;
  }
}

export function storyVideoEmbedUrl(value:string|null|undefined){
  if(!value)return null;
  try{
    const url=new URL(value);
    const host=url.hostname.toLowerCase().replace(/^www[.]/,'');

    if(host==='youtu.be'){
      const id=url.pathname.split('/').filter(Boolean)[0];
      return id?'https://www.youtube.com/embed/'+encodeURIComponent(id):null;
    }

    if(host==='youtube.com'||host.endsWith('.youtube.com')){
      if(url.pathname==='/watch'){
        const id=url.searchParams.get('v');
        return id?'https://www.youtube.com/embed/'+encodeURIComponent(id):null;
      }
      const parts=url.pathname.split('/').filter(Boolean);
      if((parts[0]==='shorts'||parts[0]==='embed')&&parts[1]){
        return 'https://www.youtube.com/embed/'+encodeURIComponent(parts[1]);
      }
      return null;
    }

    if(host==='vimeo.com'||host.endsWith('.vimeo.com')){
      const id=url.pathname.split('/').filter(Boolean).find(part=>/^\d+$/.test(part));
      return id?'https://player.vimeo.com/video/'+id:null;
    }

    return null;
  }catch{
    return null;
  }
}