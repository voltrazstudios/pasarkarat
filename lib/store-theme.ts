export const storeFonts=['default','classic','clean','modern','vintage','typewriter'] as const;
export type StoreFont=typeof storeFonts[number];

export type StoreTheme={
  accentColor:string;
  pageBackground:string;
  cardColor:string;
  font:StoreFont;
};

export const defaultStoreTheme:StoreTheme={
  accentColor:'#c34e23',
  pageBackground:'#f8f1e5',
  cardColor:'#fff9ef',
  font:'default',
};

export function validHexColor(value:string){
  return /^#[0-9a-f]{6}$/i.test(value);
}

export function contrastText(hex:string){
  const normalized=validHexColor(hex)?hex.slice(1):'ffffff';
  const rgb=[0,2,4].map(index=>parseInt(normalized.slice(index,index+2),16)/255);
  const luminance=rgb.map(value=>value<=0.03928?value/12.92:Math.pow((value+0.055)/1.055,2.4))
    .reduce((sum,value,index)=>sum+value*[0.2126,0.7152,0.0722][index],0);
  return luminance>0.42?'#17333a':'#ffffff';
}

export function storeFontFamily(font:StoreFont){
  if(font==='classic')return 'Georgia, "Times New Roman", serif';
  if(font==='clean')return 'var(--font-store-inter), Arial, sans-serif';
  if(font==='modern')return 'var(--font-store-manrope), Arial, sans-serif';
  if(font==='vintage')return 'var(--font-heading), Georgia, serif';
  if(font==='typewriter')return '"Courier New", Courier, monospace';
  return 'var(--font-body), Arial, sans-serif';
}

export function storeThemeVariables(theme:StoreTheme){
  return {
    '--store-accent':theme.accentColor,
    '--store-accent-text':contrastText(theme.accentColor),
    '--store-page':theme.pageBackground,
    '--store-page-text':contrastText(theme.pageBackground),
    '--store-card':theme.cardColor,
    '--store-card-text':contrastText(theme.cardColor),
    '--store-font-family':storeFontFamily(theme.font),
  };
}
