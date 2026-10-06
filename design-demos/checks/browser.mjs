import { chromium, firefox, webkit } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const demoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.resolve(demoRoot,'..','.workshop','journey-review');
process.env.TMPDIR=path.join(root,'tmp');
await mkdir(process.env.TMPDIR,{recursive:true});
const mode=process.argv[2]||'check';
const base=process.argv[3]||process.env.JOURNEY_BASE_URL||'http://127.0.0.1:3120';
const names=['blocks','voyage','reactor','linux','connections','beyond'];
const results=[];
await mkdir(path.join(root,'qa'),{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});

async function ready(page,name){
  await page.waitForFunction(({value,index})=>document.body.dataset.world===value&&document.querySelector('#universe').dataset.ready==='true'&&document.querySelector('#universe').dataset.renderedWorld===value&&Math.abs(Number(document.querySelector('#universe').dataset.progress)-index)<.005,{value:name,index:names.indexOf(name)},{timeout:45000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(100);
}
function observe(page,{fallback=false}={}){
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!(fallback&&/^(?:THREE\.WebGLRenderer: )+(?:Error creating WebGL context|A WebGL context could not be created)/i.test(m.text())))errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  return errors;
}
async function screenshot(page,name){
  await page.screenshot({path:path.join(root,'qa',name),animations:'disabled',timeout:45000});
}
async function captureProfile(device,viewport){
  const context=await browser.newContext({viewport,reducedMotion:'reduce',deviceScaleFactor:1,isMobile:device==='mobile',hasTouch:device==='mobile'});
  const page=await context.newPage();const errors=observe(page);
  try{
    await page.goto(base+'/#blocks',{waitUntil:'networkidle'});
    for(const [index,name] of names.entries()){
      if(index)await page.locator(`.world-node[data-index="${index}"]`).click();
      await ready(page,name);
      const measurements=await page.evaluate(()=>({
        overflow:document.documentElement.scrollWidth>innerWidth,
        calls:Number(document.querySelector('#universe').dataset.drawCalls),
        triangles:Number(document.querySelector('#universe').dataset.triangles),
        clippedTitle:(()=>{const h=document.querySelector('.chapter[data-active="true"] h1');return h.scrollWidth>h.clientWidth+2})()
      }));
      assert.equal(measurements.overflow,false,`${name}/${device} overflows`);
      assert.equal(measurements.clippedTitle,false,`${name}/${device} title clips`);
      await screenshot(page,`${name}-${device}.png`);
      const style=await page.addStyleTag({content:'.site-header,.chapter-copy,.world-caption,.inspect-hint,.journey-footer,.journey-progress,.render-status,.credits-button,.scene-shade,.film-grain {visibility:hidden!important}'});
      await screenshot(page,`${name}-${device}-canvas.png`);
      await style.evaluate(element=>element.remove());
      assert.deepEqual(errors,[]);
      results.push({capture:name,device,...measurements});console.log(JSON.stringify(results.at(-1)));
    }
  }catch(error){console.log(JSON.stringify({errors,current:await page.locator('body').getAttribute('data-world')}));throw error;}
  finally{await context.close();}
}

async function captureObjects(){
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',deviceScaleFactor:1});
  const page=await context.newPage();const errors=observe(page);
  try{
    await page.route('**/scripts/main.js',async route=>{
      const response=await route.fetch();
      const source=await response.text();
      assert.ok(source.includes('alpha:false')&&source.includes('scene.add(stars);'),'Poster capture hooks changed');
      await route.fulfill({response,body:source.replace('alpha:false','alpha:true').replace('scene.add(stars);','scene.add(stars);sky.visible=false;stars.visible=false;')});
    });
    await page.route('**/assets/posters/reactor-open.webp',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'}));
    await page.goto(base+'/#blocks',{waitUntil:'networkidle'});
    await page.addStyleTag({content:'html,body,.universe {background:transparent!important}.site-header,.chapter-copy,.world-caption,.inspect-hint,.journey-footer,.journey-progress,.render-status,.credits-button,.scene-shade,.film-grain,.sky-fallback,.scene-poster {visibility:hidden!important}'});
    for(const name of names){
      await page.evaluate(value=>{location.hash=value},name);
      await ready(page,name);
      await page.screenshot({path:path.join(root,'qa',`${name}-object.png`),omitBackground:true,animations:'disabled',timeout:45000});
      results.push({object:name,transparent:true});
      if(name==='reactor'){
        await page.locator('[data-action="2"]').evaluate(element=>element.click());
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        await page.screenshot({path:path.join(root,'qa','reactor-open-object.png'),omitBackground:true,animations:'disabled',timeout:45000});
        results.push({object:'reactor-open',transparent:true});
        await page.locator('[data-action="2"]').evaluate(element=>element.click());
      }
    }
    assert.deepEqual(errors,[]);console.log('Captured all six worlds, including the disassembled armor, on transparent backgrounds.');
  }finally{await context.close();}
}

async function interactions(viewport){
  const context=await browser.newContext({viewport,reducedMotion:'reduce',isMobile:viewport.width<681,hasTouch:viewport.width<681});
  const page=await context.newPage();const errors=observe(page);
  try{
    await page.goto(base+'/#blocks',{waitUntil:'networkidle'});await ready(page,'blocks');
    for(let index=0;index<names.length;index++){
      if(index)await page.locator(`.world-node[data-index="${index}"]`).click();await ready(page,names[index]);
      assert.equal(await page.locator('.world-node[aria-current="step"]').getAttribute('data-index'),String(index));
      const geometry=await page.evaluate(()=>{const copy=document.querySelector('.chapter[data-active="true"] .chapter-copy').getBoundingClientRect();const footer=document.querySelector('.journey-footer').getBoundingClientRect();return{overlap:copy.bottom>footer.top-5,overflow:document.documentElement.scrollWidth>innerWidth}});
      assert.equal(geometry.overlap,false,`${names[index]} copy overlaps navigation at ${viewport.width}`);assert.equal(geometry.overflow,false);
      if(index<5){
        const button=page.locator(`[data-action="${index}"]`);await button.click();if(index!==3)assert.equal(await button.getAttribute('aria-pressed'),'true');
        if(index===2)await screenshot(page,`reactor-open-${viewport.width}.png`);
        if(index===3){assert.match(await page.locator('.chapter[data-active="true"] .action-status').innerText(),/Kubuntu/);await button.click();assert.match(await page.locator('.chapter[data-active="true"] .action-status').innerText(),/Arch/);}
        const read=page.locator(`[data-story="${index}"]`);await read.click();await page.locator('#story-dialog[open]').waitFor();assert.ok(await page.locator('#story-dialog .story-source').getAttribute('href'));
        if(index===0)await screenshot(page,`story-${viewport.width}.png`);
        await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);assert.equal(await read.evaluate(el=>el===document.activeElement),true);
      }else{
        assert.equal(await page.locator('.follow-link').getAttribute('href'),'https://github.com/DeadIndian');assert.equal(await page.locator('.social-links a').count(),2);
      }
    }
    await page.locator('#map-button').click();await page.locator('#map-dialog[open]').waitFor();assert.equal(await page.locator('.map-world').count(),6);await screenshot(page,`map-${viewport.width}.png`);await page.locator('[data-destination="1"]').click();await ready(page,'voyage');
    await page.locator('.world-node[data-index="4"]').click();await ready(page,'connections');await page.goBack();await ready(page,'voyage');await page.goForward();await ready(page,'connections');
    await page.locator('.world-node[data-index="4"]').focus();await page.keyboard.press('ArrowLeft');await ready(page,'linux');
    await page.locator('.world-node[data-index="3"]').focus();await page.keyboard.press('Home');await ready(page,'blocks');
    await page.locator('.world-node[data-index="0"]').focus();await page.keyboard.press('End');await ready(page,'beyond');
    await page.locator('#credits-button').click();await page.locator('#story-dialog[open]').waitFor();assert.match(await page.locator('#story-title').innerText(),/personal universe/);await page.keyboard.press('Escape');
    assert.deepEqual(errors,[]);results.push({interactionWidth:viewport.width,worlds:6,actions:5,dialogs:true,focus:true,map:true,history:true,keyboard:true,errors});console.log(JSON.stringify(results.at(-1)));
  }finally{await context.close();}
}

async function fallback(viewport={width:390,height:844}){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});const page=await context.newPage();const errors=observe(page,{fallback:true});
  try{
    await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){if(['webgl','webgl2','experimental-webgl'].includes(kind))return null;return original.call(this,kind,...args)}});
    await page.goto(base+'/#blocks',{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#universe').dataset.fallback==='true');
    const sources=new Set();
    for(let index=0;index<names.length;index++){
      await page.locator(`.world-node[data-index="${index}"]`).click();await page.waitForFunction(name=>document.body.dataset.world===name,names[index]);
      await page.waitForFunction(()=>{const image=document.querySelector('#scene-poster img');return image.complete&&image.naturalWidth>100});
      sources.add(await page.locator('#scene-poster img').evaluate(image=>image.currentSrc));
      await screenshot(page,`${names[index]}-fallback-${viewport.width}.png`);
    }
    assert.equal(sources.size,6);assert.deepEqual(errors,[]);results.push({fallback:true,viewport,worlds:6,posters:true,errors});console.log(JSON.stringify(results.at(-1)));
  }finally{await context.close();}
}

async function layout(){
  for(const viewport of [{width:320,height:568},{width:375,height:667},{width:844,height:390},{width:1024,height:768},{width:1366,height:768},{width:1920,height:1080}]){
    const context=await browser.newContext({viewport,reducedMotion:'reduce'});const page=await context.newPage();const errors=observe(page);
    try{
      await page.goto(base,{waitUntil:'networkidle'});
      for(const [index,name] of names.entries()){
        await page.locator(`.world-node[data-index="${index}"]`).click();await ready(page,name);
        const measurement=await page.evaluate(()=>{
          const copy=document.querySelector('.chapter[data-active="true"] .chapter-copy'),title=copy.querySelector('h1'),rect=copy.getBoundingClientRect(),footer=document.querySelector('.journey-footer').getBoundingClientRect();
          return{overflow:document.documentElement.scrollWidth>innerWidth,clipped:title.scrollWidth>title.clientWidth+2,copyBottom:Math.round(rect.bottom),footerTop:Math.round(footer.top),opacity:getComputedStyle(copy).opacity};
        });
        assert.equal(measurement.overflow,false,`${name} overflows at ${viewport.width}×${viewport.height}`);
        assert.equal(measurement.clipped,false,`${name} title clips at ${viewport.width}×${viewport.height}`);
        assert.ok(measurement.copyBottom<measurement.footerTop-5,`${name} copy overlaps footer at ${viewport.width}×${viewport.height}: ${JSON.stringify(measurement)}`);
        assert.equal(Number(measurement.opacity),1,`${name} is still faded`);
        if(viewport.width<=844)await screenshot(page,`${name}-${viewport.width}x${viewport.height}.png`);
      }
      assert.deepEqual(errors,[]);results.push({layout:viewport,worlds:6,errors});console.log(JSON.stringify(results.at(-1)));
    }finally{await context.close();}
  }
}

async function motionAndNavigation(){
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});const page=await context.newPage();const errors=observe(page);
  try{
    await page.goto(base+'/#reactor',{waitUntil:'networkidle'});await ready(page,'reactor');
    await page.waitForFunction(()=>Number(document.querySelector('#universe').dataset.time)>.1);
    await page.locator('#motion-button').click();await page.waitForTimeout(100);
    const paused=await page.locator('#universe').getAttribute('data-time');await page.waitForTimeout(180);
    assert.equal(await page.locator('#universe').getAttribute('data-time'),paused,'Paused scene keeps animating');
    await page.evaluate(()=>window.scrollTo({top:document.querySelector('#linux').offsetTop+innerHeight*.25,behavior:'instant'}));
    await ready(page,'linux');assert.equal(await page.locator('#universe').getAttribute('data-progress'),'3.0000','Paused scroll still flies the camera');
    await page.locator('.world-node[data-index="0"]').click();await ready(page,'blocks');
    await page.locator('#motion-button').click();await page.locator('#next-world').click();await ready(page,'voyage');
    await page.locator('.world-node[data-index="2"]').click();await ready(page,'reactor');
    await page.locator('[data-story="2"]').click();await page.locator('#story-dialog[open]').waitFor();
    const behindDialog=await page.locator('#universe').getAttribute('data-time');await page.waitForTimeout(150);assert.equal(await page.locator('#universe').getAttribute('data-time'),behindDialog,'Scene keeps running behind a dialog');
    await page.keyboard.press('Escape');await page.locator('#motion-button').click();
    await page.locator('.world-node[data-index="5"]').click();await ready(page,'beyond');await page.locator('#next-world').click();await ready(page,'blocks');
    await page.mouse.wheel(0,1000);await ready(page,'voyage');
    await page.reload({waitUntil:'networkidle'});await ready(page,'voyage');
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.body.dataset.motion==='off');
    const next=page.locator('#next-world');await next.click();await ready(page,'reactor');
    await screenshot(page,'navigation-reactor.png');
    await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2');gl.getExtension('WEBGL_lose_context').loseContext();});
    await page.waitForFunction(()=>document.querySelector('#universe').dataset.fallback==='true');
    await next.click();await page.waitForFunction(()=>document.body.dataset.world==='linux');
    await page.waitForFunction(()=>document.querySelector('#scene-poster img').complete&&document.querySelector('#scene-poster img').naturalWidth>100);
    assert.deepEqual(errors,[]);results.push({motion:true,deepLinks:true,next:true,restart:true,wheel:true,reload:true,contextLoss:true,errors});console.log(JSON.stringify(results.at(-1)));
  }finally{await context.close();}
}

async function accessibility(){
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
    const context=await browser.newContext({viewport,reducedMotion:'reduce'});const page=await context.newPage();
    try{
      await page.goto(base,{waitUntil:'networkidle'});
      for(const [index,name] of names.entries()){
        await page.locator(`.world-node[data-index="${index}"]`).click();await ready(page,name);
        const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
        const violations=audit.violations.map(({id,impact,nodes})=>({id,impact,nodes:nodes.map(({target,failureSummary})=>({target,failureSummary}))}));
        assert.deepEqual(violations,[],`${name} accessibility at ${viewport.width}: ${JSON.stringify(violations)}`);
      }
      await page.locator('#map-button').click();await page.locator('#map-dialog[open]').waitFor();
      const map=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();assert.deepEqual(map.violations.map(({id,nodes})=>({id,targets:nodes.map(n=>n.target)})),[]);
      await page.keyboard.press('Escape');await page.locator('.world-node[data-index="0"]').click();await ready(page,'blocks');await page.locator('[data-story="0"]').click();
      const story=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();assert.deepEqual(story.violations.map(({id,nodes})=>({id,targets:nodes.map(n=>n.target)})),[]);
      results.push({accessibilityWidth:viewport.width,worlds:6,dialogs:2,violations:0});console.log(JSON.stringify(results.at(-1)));
    }finally{await context.close();}
  }
}

async function otherBrowsers(engines=[firefox,webkit]){
  for(const engine of engines){
    const other=await engine.launch({headless:true});
    try{
      const page=await other.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});const errors=observe(page,{fallback:true});
      await page.goto(base+'/#linux',{waitUntil:'networkidle'});
      await page.waitForFunction(()=>{const host=document.querySelector('#universe');return host.dataset.ready==='true'||host.dataset.fallback==='true';});
      const staticView=await page.locator('#universe').getAttribute('data-fallback')==='true';
      const posters=new Set();
      for(const [index,name] of names.entries()){
        await page.locator(`.world-node[data-index="${index}"]`).click();
        await page.waitForFunction(value=>document.body.dataset.world===value&&getComputedStyle(document.querySelector('.chapter[data-active="true"] .chapter-copy')).opacity==='1',name);
        if(staticView){
          await page.waitForFunction(()=>{const image=document.querySelector('#scene-poster img');return image.complete&&image.naturalWidth>100});
          posters.add(await page.locator('#scene-poster img').evaluate(image=>image.currentSrc));
        }else await ready(page,name);
      }
      if(staticView)assert.equal(posters.size,6,'Every world needs its own fallback artwork');
      await page.locator('#map-button').click();await page.locator('[data-destination="1"]').click();await page.locator('[data-story="1"]').click();await page.locator('#story-dialog[open]').waitFor();await page.keyboard.press('Escape');
      await screenshot(page,`${engine.name()}-voyage.png`);
      assert.deepEqual(errors,[]);results.push({browser:engine.name(),worlds:6,dialogs:true,rendering:staticView?'static fallback':'WebGL',posters:staticView?posters.size:undefined,errors});console.log(JSON.stringify(results.at(-1)));
    }finally{await other.close();}
  }
}

try{
  if(['suit','suit-preview','suit-objects'].includes(mode)){const {reviewSuit}=await import('./suit.mjs');results.push(...await reviewSuit({browser,base,root,mode}));}
  if(mode==='objects')await captureObjects();
  if(mode==='capture'||mode==='desktop')await captureProfile('desktop',{width:1440,height:1000});
  if(mode==='capture'||mode==='mobile')await captureProfile('mobile',{width:390,height:844});
  if(mode==='check'){
    for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:740},{width:768,height:1024}])await interactions(viewport);
    await fallback();
  }
  if(mode==='fallback')for(const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390}])await fallback(viewport);
  if(mode==='layout')await layout();
  if(mode==='motion')await motionAndNavigation();
  if(mode==='a11y')await accessibility();
  if(mode==='engines')await otherBrowsers();
  if(mode==='firefox')await otherBrowsers([firefox]);
  if(mode==='webkit')await otherBrowsers([webkit]);
}finally{
  await browser.close();await writeFile(path.join(root,`qa/${mode}-results.json`),JSON.stringify(results,null,2)+'\n');
}
