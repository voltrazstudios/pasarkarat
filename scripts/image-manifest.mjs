import fs from 'node:fs';
import path from 'node:path';
// Run before dev/build so absent sample images use the existing visual fallback without 404s.
const files=fs.readdirSync('public',{recursive:true}).filter(file=>/\.(png|jpe?g|webp|avif|svg)$/i.test(file)&&fs.statSync(path.join('public',file)).isFile());
fs.writeFileSync('data/image-assets.json',JSON.stringify(files.map(file=>'/'+file.replaceAll('\\','/')).sort(),null,2)+'\n');
