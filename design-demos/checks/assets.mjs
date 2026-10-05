import sharp from 'sharp';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const demoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.resolve(demoRoot,'..','.workshop','journey-review');
const assets=path.join(demoRoot,'assets');
await mkdir(path.join(assets,'posters'),{recursive:true});
let starSeed=897;
const starRandom=()=>{starSeed=starSeed*16807%2147483647;return(starSeed-1)/2147483646;};
const stars=Array.from({length:420},()=>`<circle cx="${(starRandom()*1440).toFixed(1)}" cy="${(starRandom()*1000).toFixed(1)}" r="${(.35+starRandom()**4*.95).toFixed(2)}" opacity="${(.2+starRandom()*.65).toFixed(2)}"/>`).join('');
await writeFile(path.join(assets,'stars.svg'),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 1000"><g fill="#b8d1da">${stars}</g></svg>`);
if(process.argv[2]==='posters'){
  for(const name of ['blocks','voyage','reactor','linux','connections','beyond']){
    const input=path.join(root,`qa/${name}-object.png`);
    const metadata=await sharp(input).metadata();
    if(!metadata.hasAlpha)throw new Error(`${name} capture needs a transparent background`);
    await sharp(input).trim({threshold:2}).extend({top:8,bottom:8,left:8,right:8,background:'#00000000'}).webp({quality:86,effort:5}).toFile(path.join(assets,`posters/${name}.webp`));
  }
  for(const name of ['blocks','voyage','reactor','linux','connections','beyond'])for(const device of ['desktop','mobile']){
    await unlink(path.join(assets,`posters/${name}-${device}.webp`)).catch(error=>{if(error.code!=='ENOENT')throw error;});
  }
  console.log('Saved six transparent world previews that fit any screen.');
}else{
  const pixels=Buffer.alloc(144*144*3);let seed=957;
  for(let i=0;i<pixels.length;i+=3){seed=seed*16807%2147483647;const value=90+Math.floor((seed-1)/2147483646*150);pixels[i]=pixels[i+1]=pixels[i+2]=value;}
  await sharp(pixels,{raw:{width:144,height:144,channels:3}}).png().toFile(path.join(assets,'grain.png'));
  await writeFile(path.join(assets,'icon.svg'),'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#0b1e20"/><path d="m32 9 6 17 17 6-17 6-6 17-6-17L9 32l17-6Z" fill="#b4df82"/><circle cx="32" cy="32" r="21" fill="none" stroke="#b4df82" stroke-width="1"/></svg>');
  console.log('Prepared grain, identity, and stars. Rendered posters follow the visual pass.');
}
