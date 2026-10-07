export function StoreBanner({
  src,
  preview=false,
  emptyLabel,
  positionX=50,
  positionY=50,
}:{
  src:string;
  preview?:boolean;
  emptyLabel?:string;
  positionX?:number;
  positionY?:number;
}){
  if(!src&&!emptyLabel)return null;
  return <div className={`seller-store-banner${preview?' store-banner-editor-preview':''}`}>
    {src?<img
      src={src}
      alt={preview?'Shop banner preview':''}
      draggable={false}
      style={{objectPosition:`${positionX}% ${positionY}%`}}
    />:<div className="store-banner-empty">{emptyLabel}</div>}
  </div>;
}
