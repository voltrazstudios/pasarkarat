export function StoreBanner({
  src,
  preview=false,
  emptyLabel,
}:{
  src:string;
  preview?:boolean;
  emptyLabel?:string;
}){
  if(!src&&!emptyLabel)return null;
  return <div className={`seller-store-banner${preview?' store-banner-editor-preview':''}`}>
    {src?<img
      src={src}
      alt={preview?'Shop banner preview':''}
      draggable={false}
    />:<div className="store-banner-empty">{emptyLabel}</div>}
  </div>;
}
