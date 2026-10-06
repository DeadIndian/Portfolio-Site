import assert from 'node:assert/strict';
import path from 'node:path';

export async function reviewSuit({browser,base,root,mode}) {
  const results=[],preview=mode==='suit-preview',objects=mode==='suit-objects';
  async function instrument(page){
    await page.route('**/scripts/main.js',async route=>{
      const response=await route.fetch();let source=await response.text();
      assert.ok(source.includes('const worlds=createWorlds();'),'Scene review hook changed');
      source=source.replace('const worlds=createWorlds();','const worlds=createWorlds();window.__suitReview={worlds,camera,THREE};');
      if(objects)source=source.replace('alpha:false','alpha:true').replace('scene.add(stars);','scene.add(stars);sky.visible=false;stars.visible=false;');
      await route.fulfill({response,body:source});
    });
    // These renders generate the new artwork. Keep the hidden, not-yet-created
    // poster from producing a spurious 404 during the capture itself.
    if(preview||objects)await page.route('**/assets/posters/reactor-open.webp',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'}));
  }
  async function ready(page,expanded=false){
    await page.waitForFunction(expanded=>{
      const review=window.__suitReview,host=document.querySelector('#universe');
      return document.body.dataset.world==='reactor'&&host.dataset.ready==='true'&&host.dataset.renderedWorld==='reactor'&&Math.abs(Number(host.dataset.progress)-2)<.005&&review&&Math.abs(review.worlds[2].expansion-(expanded?1:0))<.00001;
    },expanded,{timeout:45000});
    await page.evaluate(()=>document.fonts.ready);
  }
  async function geometry(page){
    return page.evaluate(()=>{
      const {worlds,camera,THREE}=window.__suitReview,world=worlds[2],bounds={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
      world.group.updateMatrixWorld(true);camera.updateMatrixWorld(true);
      world.model.traverse(object=>{
        if(!object.isMesh)return;
        const position=object.geometry.attributes.position,point=new THREE.Vector3();
        for(let i=0;i<position.count;i++){
          point.fromBufferAttribute(position,i).applyMatrix4(object.matrixWorld).project(camera);
          const x=(point.x+1)*innerWidth/2,y=(1-point.y)*innerHeight/2;
          bounds.left=Math.min(bounds.left,x);bounds.right=Math.max(bounds.right,x);bounds.top=Math.min(bounds.top,y);bounds.bottom=Math.max(bounds.bottom,y);
        }
      });
      const style=document.querySelector('#scene-poster').style;
      const area={left:parseFloat(style.left),top:parseFloat(style.top)};
      area.right=area.left+parseFloat(style.width);area.bottom=area.top+parseFloat(style.height);
      return{bounds,area:{left:area.left,right:area.right,top:area.top,bottom:area.bottom},parts:world.model.children.filter(part=>part.name).map(part=>({name:part.name,position:part.position.toArray(),quaternion:part.quaternion.toArray()})),triangles:Number(document.querySelector('#universe').dataset.triangles),calls:Number(document.querySelector('#universe').dataset.drawCalls)};
    });
  }
  function fits(render,label){
    const {bounds:b,area:a}=render;
    assert.ok(b.left>=a.left-3&&b.right<=a.right+3&&b.top>=a.top-3&&b.bottom<=a.bottom+3,`${label} leaves the scene area: ${JSON.stringify({bounds:b,area:a})}`);
    assert.ok(render.triangles<100000,`${label} exceeds the mobile triangle budget`);
  }
  const viewports=objects?[{width:1440,height:1000}]:preview?[{width:1440,height:1000},{width:390,height:844}]:[{width:1440,height:1000},{width:390,height:844},{width:320,height:568},{width:844,height:390}];
  for(const viewport of viewports){
    const context=await browser.newContext({viewport,reducedMotion:'reduce',deviceScaleFactor:1});const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
    try{
      await instrument(page);await page.goto(base+'/#reactor',{waitUntil:'networkidle'});await ready(page);
      if(objects)await page.addStyleTag({content:'html,body,.universe {background:transparent!important}.site-header,.chapter-copy,.world-caption,.inspect-hint,.journey-footer,.journey-progress,.render-status,.credits-button,.scene-shade,.film-grain,.sky-fallback,.scene-poster {visibility:hidden!important}'});
      const closed=await geometry(page);
      if(!preview)fits(closed,`Assembled suit ${viewport.width}`);
      await page.screenshot({path:path.join(root,'qa',objects?'reactor-object.png':`suit-assembled-${viewport.width}.png`),omitBackground:objects,animations:'disabled'});
      const button=page.locator('[data-action="2"]');
      if(objects)await button.evaluate(element=>element.click());else{await button.focus();await page.keyboard.press('Enter');}
      await ready(page,true);
      assert.equal(await button.getAttribute('aria-pressed'),'true');assert.match(await button.textContent(),/Reassemble the suit/);
      const opened=await geometry(page);
      if(!preview)fits(opened,`Exploded suit ${viewport.width}`);
      const moved=opened.parts.filter((part,index)=>part.position.some((value,axis)=>Math.abs(value-closed.parts[index].position[axis])>.1));
      assert.ok(moved.length>=20,'The armor must actually separate into individual parts');
      await page.screenshot({path:path.join(root,'qa',objects?'reactor-open-object.png':`suit-exploded-${viewport.width}.png`),omitBackground:objects,animations:'disabled'});
      await button.evaluate(element=>element.click());await ready(page);
      assert.deepEqual((await geometry(page)).parts,closed.parts,'The armor did not return to its assembled position');
      assert.match(await button.textContent(),/Disassemble the suit/);assert.equal(await button.getAttribute('aria-pressed'),'false');
      assert.deepEqual(errors,[]);
      const result={suit:true,viewport,parts:moved.length,assembled:closed.bounds,exploded:opened.bounds,area:opened.area,calls:opened.calls,triangles:opened.triangles,reassembled:true,errors};results.push(result);console.log(JSON.stringify(result));
    }finally{await context.close();}
  }
  if(!preview&&!objects){
    const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});const page=await context.newPage();
    try{
      await instrument(page);await page.goto(base+'/#reactor',{waitUntil:'networkidle'});await ready(page);
      const button=page.locator('[data-action="2"]');await button.click();
      await page.waitForFunction(()=>window.__suitReview.worlds[2].expansion>.05&&window.__suitReview.worlds[2].expansion<.95);
      fits(await geometry(page),'Suit during separation');
      await button.click();await ready(page);
      await button.click();await ready(page,true);
      await page.locator('.world-node[data-index="3"]').click();await page.waitForFunction(()=>document.body.dataset.world==='linux');
      await page.locator('.world-node[data-index="2"]').click();await ready(page,true);
      await page.locator('#motion-button').click();await button.click();await ready(page);
      results.push({suitMotion:true,reversal:true,retainsState:true,pausedInteraction:true});
    }finally{await context.close();}
    const delayedContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const delayed=await delayedContext.newPage();
    let releaseModel;const modelGate=new Promise(resolve=>{releaseModel=resolve;});
    try{
      await instrument(delayed);await delayed.route('**/scripts/worlds.js',async route=>{await modelGate;await route.continue();});
      await delayed.goto(base+'/#reactor',{waitUntil:'domcontentloaded'});
      await delayed.locator('[data-action="2"]').click();releaseModel();await ready(delayed,true);
      fits(await geometry(delayed),'Suit opened while loading');
      await delayed.locator('[data-action="2"]').click();await ready(delayed);
      fits(await geometry(delayed),'Suit reassembled after loading');
      results.push({suitEarlyInteraction:true,bothStatesFramed:true});
    }finally{releaseModel();await delayedContext.close();}
    const fallbackContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const fallback=await fallbackContext.newPage(),errors=[];
    fallback.on('pageerror',error=>errors.push(error.message));
    try{
      await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return ['webgl','webgl2','experimental-webgl'].includes(kind)?null:original.call(this,kind,...args);};});
      await fallback.goto(base+'/#reactor',{waitUntil:'networkidle'});await fallback.waitForFunction(()=>document.querySelector('#universe').dataset.fallback==='true');
      const poster=fallback.locator('#scene-poster img'),button=fallback.locator('[data-action="2"]');
      await fallback.waitForFunction(()=>{const image=document.querySelector('#scene-poster img');return image.complete&&image.naturalWidth>100;});
      assert.match(await poster.getAttribute('src'),/reactor\.webp$/);await button.click();
      await fallback.waitForFunction(()=>{const image=document.querySelector('#scene-poster img');return image.src.endsWith('reactor-open.webp')&&image.complete&&image.naturalWidth>100;});
      await fallback.screenshot({path:path.join(root,'qa','suit-fallback-open-390.png'),animations:'disabled'});
      await button.click();assert.match(await poster.getAttribute('src'),/reactor\.webp$/);assert.deepEqual(errors,[]);
      results.push({suitFallback:true,assembledAndExploded:true,reassembled:true,errors});
    }finally{await fallbackContext.close();}
  }
  return results;
}
