import { chapters, icons, links } from './content.js';
import { journeyChapterFromHash, navigatePersona, subscribePersona } from '@/lib/persona';

export function mountJourney(root, options) {
const events = new AbortController();
const listen = (target, type, callback, settings = {}) => target.addEventListener(type, callback, {...settings, signal: events.signal});
let destroyed = false, visible = true, motionLocked = options.motionLocked;
let graphicsCleanup = () => {};
const scrollRestoration = window.history.scrollRestoration;
const themeColor = document.querySelector('meta[name="theme-color"]');

const journey=root.querySelector('#journey');
const controls=root.querySelector('#world-navigation');
const sceneHost=root.querySelector('#universe');
const scenePoster=root.querySelector('#scene-poster');
const status=root.querySelector('#render-status');
const motionButton=root.querySelector('#motion-button');
const storyDialog=root.querySelector('#story-dialog');
const mapDialog=root.querySelector('#map-dialog');
const stackedLayout=matchMedia('(max-width:680px), (max-width:900px) and (orientation:portrait)');
window.history.scrollRestoration='manual';
const states=chapters.map(()=>({active:false,count:0}));
const shortNames=['Build','Dream','Invent','Tinker','Share','Beyond'];
const captions=['A FEW BLOCKS. A BEGINNING.','A DREAM WORTH CHASING.','AN IDEA THAT STAYED.','EVERY DETAIL, MY OWN.','THE PEOPLE. THE PURPOSE.','THERE IS MORE TO COME.'];
let active=0,progress=0,motion=options.motion,pending=null,rendererController=null,uiFrame=0,opener=null;

journey.replaceChildren();controls.replaceChildren();
chapters.forEach((chapter,index)=>{
  const section=document.createElement('section');section.className='chapter';section.id=chapter.id;section.dataset.chapter=chapter.id;section.setAttribute('aria-label',`${index+1}. ${chapter.name}`);
  section.innerHTML=`<article class="chapter-copy" inert aria-hidden="true"><p class="chapter-kicker"><span>0${index+1} / 06</span><i></i><span>${chapter.theme}</span></p><h1 class="chapter-title" tabindex="-1"><span>${chapter.title[0]}</span><span>${chapter.title[1]}</span></h1><p class="chapter-intro">${chapter.intro}</p><p class="chapter-thought">${chapter.thought}</p>${index<5?`<div class="chapter-actions"><button class="world-action" data-action="${index}" aria-pressed="false"><span class="action-mark" aria-hidden="true"></span><span>${chapter.action}</span></button><button class="read-story" data-story="${index}">The story ${icons.diagonal}</button></div><p class="action-status" aria-live="polite"></p>`:`<div class="chapter-actions"><a class="follow-link" href="${links.github}" target="_blank" rel="noopener noreferrer">Follow my journey ${icons.diagonal}</a></div><div class="social-links"><a href="${links.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn ${icons.diagonal}</a><a href="${links.email}">Say hello ${icons.diagonal}</a></div>`}</article>`;
  journey.append(section);
  const button=document.createElement('button');button.className='world-node';button.dataset.index=String(index);button.style.setProperty('--node',chapter.accent);button.setAttribute('aria-label',`${index+1}. ${chapter.name} — ${chapter.theme}`);
  button.innerHTML=`<span class="node-orbit" aria-hidden="true"><i></i></span><span class="node-name">${shortNames[index]}</span>`;
  listen(button,'click',()=>goTo(index));
  listen(button,'keydown',event=>{
    if(event.altKey||event.metaKey||event.ctrlKey)return;
    const target=event.key==='ArrowRight'?index+1:event.key==='ArrowLeft'?index-1:event.key==='Home'?0:event.key==='End'?chapters.length-1:null;
    if(target===null)return;event.preventDefault();const next=Math.max(0,Math.min(chapters.length-1,target));goTo(next);controls.children[next].focus({preventScroll:true});
  });
  controls.append(button);
});
const sections=[...root.querySelectorAll('.chapter')];
const copies=sections.map(section=>section.querySelector('.chapter-copy'));
root.querySelectorAll('[data-icon]').forEach(node=>{node.innerHTML=icons[node.dataset.icon]||'';});
root.querySelectorAll('[data-action]').forEach(button=>listen(button,'click',()=>activateWorld(Number(button.dataset.action))));
root.querySelector('[data-action="3"]').removeAttribute('aria-pressed');
root.querySelectorAll('[data-story]').forEach(button=>listen(button,'click',()=>openStory(Number(button.dataset.story))));
listen(root.querySelector('#next-world'),'click',()=>goTo((pending??active)===5?0:(pending??active)+1));
listen(root.querySelector('#inspect-button'),'click',()=>rendererController?.rotate());
root.querySelector('#inspect-button').setAttribute('aria-label','Rotate the current world');
listen(root.querySelector('.skip-link'),'click',event=>{event.preventDefault();root.querySelector('#journey-controls').focus({preventScroll:true});});
for(const link of root.querySelectorAll('.wordmark,.connect-link'))listen(link,'click',event=>{event.preventDefault();goTo(link.classList.contains('wordmark')?0:5);});

function scrollProgress(){
  const y=window.scrollY;
  for(let i=sections.length-1;i>=0;i--){
    if(y>=sections[i].offsetTop-1){
      if(i===sections.length-1)return i;
      return i+Math.max(0,Math.min(1,(y-sections[i].offsetTop)/(sections[i+1].offsetTop-sections[i].offsetTop)));
    }
  }
  return 0;
}
function goTo(index,{instant=false,history=true}={}){
  if(destroyed||!visible)return;
  index=Math.max(0,Math.min(chapters.length-1,index));pending=index;
  if(history&&location.hash!==`#${chapters[index].id}`)navigatePersona(`#${chapters[index].id}`);
  window.scrollTo({top:sections[index].offsetTop,behavior:instant||!motion?'instant':'smooth'});
  requestUI();
}
function routeFromHash(){
  if(destroyed||!visible)return;
  const chapter=journeyChapterFromHash(location.hash);
  if(!chapter)return;
  const index=chapters.findIndex(item=>item.id===chapter);
  if(pending===index||(active===index&&pending===null))return;
  for(const dialog of [storyDialog,mapDialog])if(dialog.open)dialog.close();
  goTo(index,{instant:true,history:false});
}
function sceneArea(index){
  const width=innerWidth,height=innerHeight,stacked=stackedLayout.matches;
  const footer=root.querySelector('.journey-footer').getBoundingClientRect();
  const header=root.querySelector('.site-header').getBoundingClientRect();
  const copyStyle=getComputedStyle(copies[index]);
  const gutter=parseFloat(copyStyle.left),copyTop=parseFloat(copyStyle.top);
  const left=stacked?18:Math.max(gutter+copies[index].offsetWidth+25,width*.46);
  const right=stacked?width-18:width-gutter-20;
  const top=stacked?copyTop+copies[index].offsetHeight+5:header.bottom+(height<521?18:45);
  const bottom=footer.top-(stacked?57:height<521?26:65);
  return{left,top,width:Math.max(120,right-left),height:Math.max(60,bottom-top)};
}
function layoutScenePoster(){
  if(destroyed||!visible)return;
  const area=sceneArea(active);
  for(const property of ['left','top','width','height'])scenePoster.style[property]=`${area[property]}px`;
  const source=`/journey/assets/posters/${chapters[active].id}${active===2&&states[2].active?'-open':''}.webp`;
  const image=scenePoster.querySelector('img');if(image.getAttribute('src')!==source)image.src=source;
}
function updateUI(){
  uiFrame=0;if(destroyed||!visible)return;const scrollPosition=scrollProgress();const next=Math.max(0,Math.min(5,Math.round(scrollPosition)));
  progress=motion?scrollPosition:next;
  if(pending!==null&&Math.abs(scrollPosition-pending)<.005)pending=null;
  const changed=next!==active;active=next;
  if(changed){
    root.querySelector('#chapter-announcement').textContent=`World ${active+1} of ${chapters.length}: ${chapters[active].name}. ${chapters[active].theme}.`;
    if(copies.some((copy,index)=>index!==active&&copy.contains(document.activeElement)))controls.children[active].focus({preventScroll:true});
  }
  root.dataset.world=chapters[active].id;
  root.dataset.chapter=chapters[active].id;
  if(themeColor)themeColor.content=chapters[active].background;
  sections.forEach((section,index)=>{
    const selected=index===active;
    section.dataset.active=String(selected);copies[index].inert=!selected;copies[index].setAttribute('aria-hidden',String(!selected));
    const distance=Math.abs(progress-index);const fade=1-Math.max(0,Math.min(1,(distance-.09)/.34));
    copies[index].style.opacity=selected?String(fade):'0';
    copies[index].style.transform=motion?`translateY(${(index-progress)*30}px)`:'none';
    const node=controls.children[index];if(selected)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');
  });
  root.querySelector('#world-place').textContent=chapters[active].place.toUpperCase();
  root.querySelector('#world-subtitle').textContent=captions[active];
  root.querySelector('#next-label').textContent=active===5?'The beginning':chapters[active+1].name;
  root.querySelector('#next-prefix').textContent=active===5?'ONE MORE ORBIT':'UP NEXT';
  root.querySelector('#next-world').setAttribute('aria-label',active===5?'Return to the beginning':`Next world: ${chapters[active+1].name}`);
  root.querySelector('#journey-progress').style.width=`${progress/5*100}%`;
  if(changed||!sceneHost.dataset.ready){
    sceneHost.style.setProperty('--scene-base',chapters[active].background);
    sceneHost.style.setProperty('--scene-glow',chapters[active].glow);
  }
  if(changed||sceneHost.dataset.ready!=='true')layoutScenePoster();
  if(changed&&pending===null)navigatePersona(`#${chapters[active].id}`,true);
  rendererController?.request();
}
function requestUI(){if(!destroyed&&visible&&!uiFrame)uiFrame=requestAnimationFrame(updateUI);}
listen(window,'scroll',requestUI,{passive:true});
listen(window,'resize',requestUI,{passive:true});
listen(window,'wheel',()=>{pending=null;},{passive:true});
listen(window,'touchstart',()=>{pending=null;},{passive:true});
const unsubscribeRoute=subscribePersona(routeFromHash);

function updateMotion(){
  root.dataset.motion=motion?'on':'off';
  motionButton.disabled=motionLocked;motionButton.setAttribute('aria-pressed',String(!motion));motionButton.setAttribute('aria-label',motionLocked?'Reduced motion enabled by system':motion?'Pause motion':'Resume motion');motionButton.innerHTML=motion?icons.pause:icons.play;
  requestUI();rendererController?.request();
}
listen(motionButton,'click',()=>{if(!motionLocked)options.onToggleMotion();});
updateMotion();

function activateWorld(index){
  if(destroyed||!visible||index===5)return;
  const state=states[index];state.active=!state.active;state.count++;
  const button=sections[index].querySelector('.world-action');if(index!==3)button.setAttribute('aria-pressed',String(state.active));button.querySelector('span:last-child').textContent=state.active?chapters[index].activeAction:chapters[index].action;
  const messages=[state.active?'Build once. Let it work.':'A few pieces, waiting to come together.',state.active?'A little conviction. A little wind in the sails.':'Choose a heading. Keep going.',state.active?'Armor apart. The engineering underneath.':'All pieces back in place.',['Kubuntu · KDE Plasma','Arch Linux · Hyprland / Celestia','Fedora · KDE Plasma'][(2+state.count)%3],state.active?'Tools. Communities. Good people.':'Every connection starts somewhere.'];
  sections[index].querySelector('.action-status').textContent=messages[index];layoutScenePoster();rendererController?.request();
}

function prepareDialog(dialog){
  listen(dialog,'click',event=>{
    if(event.target!==dialog)return;const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();
  });
  listen(dialog,'close',()=>{document.documentElement.classList.remove('journey-dialog-open');if(visible&&!destroyed)opener?.focus({preventScroll:true});rendererController?.request();});
}
prepareDialog(storyDialog);prepareDialog(mapDialog);
function showDialog(dialog){
  if(destroyed||!visible)return;
  opener=document.activeElement;document.documentElement.classList.add('journey-dialog-open');dialog.showModal();dialog.scrollTop=0;listen(dialog.querySelector('.dialog-close'),'click',()=>dialog.close());rendererController?.request();
}
function openStory(index){
  const chapter=chapters[index];
  storyDialog.innerHTML=`<div class="dialog-header"><span>0${index+1} / ${chapter.theme.toUpperCase()}</span><button class="dialog-close" aria-label="Close story">${icons.close}</button></div><div class="story-body"><h2 id="story-title">${chapter.title.join(' ')}</h2>${chapter.paragraphs.map(p=>`<p>${p}</p>`).join('')}${chapter.image?`<figure><img src="${chapter.image}" alt="${chapter.imageCaption}" width="480" height="320"><figcaption>${chapter.imageCaption}</figcaption></figure>`:''}<a class="story-source" href="${chapter.link}" target="_blank" rel="noopener noreferrer">${chapter.linkLabel}${icons.diagonal}</a><p class="art-note">${chapter.detail}</p></div>`;
  showDialog(storyDialog);
}
listen(root.querySelector('#map-button'),'click',()=>{
  mapDialog.innerHTML=`<div class="dialog-header"><span>THE JOURNEY / SIX WORLDS</span><button class="dialog-close" aria-label="Close world map">${icons.close}</button></div><div class="map-heading"><h2 id="map-title">Follow a different orbit.</h2><p>Start anywhere. These are the influences, choices, and people that connect the story.</p></div><div class="map-grid">${chapters.map((chapter,index)=>`<button class="map-world" data-destination="${index}" style="--node:${chapter.accent}" ${index===active?'aria-current="step"':''}><span class="map-number">0${index+1} / 06</span><span class="map-planet" aria-hidden="true"></span><strong>${chapter.name}</strong><small>${chapter.theme}</small></button>`).join('')}</div>`;
  mapDialog.querySelectorAll('[data-destination]').forEach(button=>listen(button,'click',()=>{mapDialog.close();goTo(Number(button.dataset.destination));}));showDialog(mapDialog);
});
listen(root.querySelector('#credits-button'),'click',()=>{
  storyDialog.innerHTML=`<div class="dialog-header"><span>THE STORY & THE ARTWORK</span><button class="dialog-close" aria-label="Close credits">${icons.close}</button></div><div class="story-body"><h2 id="story-title">A personal universe.</h2><p>Six influences and chapters in Bharath’s account. Their order tells a story; it does not assign invented dates to his life. The origin of the name DeadIndian stays a mystery.</p><p>Five worlds use original procedural 3D illustrations. The Iron Man suit adapts <a href="https://sketchfab.com/3d-models/iron-man-mark-85-rigged-dde1085c464d4f8da259fe6669ae4dd2" target="_blank" rel="noreferrer">Iron-Man Mark 85 | Rigged</a> by <a href="https://sketchfab.com/Nihar-9Afilms" target="_blank" rel="noreferrer">9A Films / Nihar Arora</a>, licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. It has been optimized, divided into armor sections, and given a disassembly animation. Minecraft, One Piece, and Iron Man belong to their respective owners. This fan-art study is not affiliated with or endorsed by them.</p><p>The Fedora logo is the supplied Fedora artwork. The calculator screenshot is an actual early portfolio artifact. The Linux screens are illustrations of the owner’s desktop journey.</p><p>Three.js is MIT licensed. The locally bundled typefaces are Manrope, Silkscreen, Instrument Serif, Bebas Neue, Space Grotesk, and Space Mono; their licenses are included with the demo.</p><p class="art-note">The personal side of Golla Bharath. <a href="/credits">Full artwork credits and licenses</a>.</p></div>`;showDialog(storyDialog);
});

const initial=journeyChapterFromHash(location.hash);
active=Math.max(0,chapters.findIndex(chapter=>chapter.id===initial));
goTo(active,{instant:true,history:false});updateUI();
document.fonts.ready.then(layoutScenePoster);

async function startUniverse(){
  try{
    const THREE=await import('three');
    const {createWorldFactory}=await import('./worlds.js');
    if(destroyed)return;
    const factory=createWorldFactory(()=>rendererController?.request());
    let renderer,scene,environment,cleaned=false;
    graphicsCleanup=()=>{
      if(cleaned)return;cleaned=true;
      factory.dispose();environment?.dispose();
      scene?.traverse(object=>{
        object.geometry?.dispose();
        for(const material of [object.material].flat().filter(Boolean))material.dispose();
      });
      renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();
    };
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.17;
    renderer.domElement.className='universe-canvas';renderer.domElement.setAttribute('aria-label','Interactive 3D worlds');sceneHost.append(renderer.domElement);
    scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,420);
    environment=factory.createEnvironment(renderer);scene.environment=environment.texture;scene.environmentIntensity=.8;
    scene.add(new THREE.HemisphereLight('#dae8e4','#354448',1.6));
    const key=new THREE.DirectionalLight('#fff0d2',3.7),rim=new THREE.DirectionalLight('#9dc9e7',2.4);scene.add(key,rim);
    const warm=new THREE.PointLight('#afdcc7',14,18,2);scene.add(warm);
    const worlds=await factory.createWorlds();
    if(destroyed)return;
    // Frame the actual geometry, excluding atmospheric glow sprites. Each world
    // gets a composition in the space left by its own text and the navigation.
    function measureWorld(world){
      world.group.updateMatrixWorld(true);
      const result=new THREE.Box3();
      world.model.traverse(object=>{
        if(!object.isMesh)return;
        if(object.isInstancedMesh){object.computeBoundingBox();result.union(object.boundingBox.clone().applyMatrix4(object.matrixWorld));}
        else{object.geometry.computeBoundingBox();result.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));}
      });
      return result;
    }
    const bounds=worlds.map((world,index)=>{
      world.update(0,1,world.explodedView?{...states[index],active:false}:states[index]);
      const bound=measureWorld(world);world.update(0,1,states[index]);return bound;
    });
    const expandedBounds=worlds.map((world,index)=>{
      if(!world.explodedView)return bounds[index];
      world.update(0,1,{...states[index],active:true});const expanded=measureWorld(world);
      world.update(0,1,states[index]);return expanded;
    });
    const path=worlds.map((_,index)=>new THREE.Vector3(index*29,Math.sin(index*1.4)*2.7,-index*6+Math.sin(index*.9)*3));
    worlds.forEach((world,index)=>{world.group.position.copy(path[index]);scene.add(world.group);});
    const skyMaterial=new THREE.ShaderMaterial({depthWrite:false,depthTest:false,uniforms:{uBase:{value:new THREE.Color(chapters[0].background)},uGlow:{value:new THREE.Color(chapters[0].glow)},uTime:{value:0},uMobile:{value:innerWidth<681?1:0}},
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,1.,1.);}`,
      fragmentShader:`varying vec2 vUv;uniform vec3 uBase;uniform vec3 uGlow;uniform float uTime;uniform float uMobile;float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}void main(){vec2 center=mix(vec2(.72,.52),vec2(.53,.34),uMobile);vec2 p=(vUv-center)*vec2(1.,.9);float halo=exp(-length(p)*4.6);float cloud=noise(vUv*4.+vec2(uTime*.002,0.))*.15+noise(vUv*9.-uTime*.001)*.05;vec3 color=mix(uBase*.65,uGlow,halo*.72);color+=uGlow*cloud*halo*.28;color*=.97+hash(vUv*1000.)*.03;gl_FragColor=vec4(color,1.);
      #include <colorspace_fragment>
      }`
    });
    const sky=new THREE.Mesh(new THREE.PlaneGeometry(2,2),skyMaterial);sky.frustumCulled=false;sky.renderOrder=-100;scene.add(sky);
    const starPositions=[],starSizes=[],starOpacity=[],starPhase=[];let seed=897;
    const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
    for(let i=0;i<2400;i++){starPositions.push((random()-.5)*330,(random()-.5)*110,-22-random()*180);starSizes.push(.55+random()**5*2.1);starOpacity.push(.17+random()*.6);starPhase.push(random()*6.28);}
    const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));starGeometry.setAttribute('aSize',new THREE.Float32BufferAttribute(starSizes,1));starGeometry.setAttribute('aAlpha',new THREE.Float32BufferAttribute(starOpacity,1));starGeometry.setAttribute('aPhase',new THREE.Float32BufferAttribute(starPhase,1));
    const starMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uDpr:{value:1},uBlock:{value:1}},
      vertexShader:`attribute float aSize;attribute float aAlpha;attribute float aPhase;uniform float uTime;uniform float uDpr;varying float vAlpha;void main(){vAlpha=aAlpha*(.8+.2*sin(uTime*.3+aPhase));gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*uDpr;}`,
      fragmentShader:`uniform float uBlock;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);float shape=mix(1.-smoothstep(.1,.5,d),1.,uBlock);gl_FragColor=vec4(.72,.82,.83,shape*vAlpha);}`
    });
    const stars=new THREE.Points(starGeometry,starMaterial);stars.position.x=70;scene.add(stars);
    let frame=0,previous=performance.now(),elapsed=0,stopped=false,suspended=false,yaw=0,pitch=0,targetYaw=0,targetPitch=0,drag=null,compositions=[],expandedCompositions=[];
    const look=new THREE.Vector3(),point=new THREE.Vector3(),raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
    const direction=new THREE.Vector3(),fromCenter=new THREE.Vector3(),toCenter=new THREE.Vector3();
    const themeBases=chapters.map(chapter=>new THREE.Color(chapter.background));
    const themeGlows=chapters.map(chapter=>new THREE.Color(chapter.glow));
    const canDraw=()=>!cleaned&&!destroyed&&visible&&!stopped&&!suspended&&!document.hidden&&!root.querySelector('dialog[open]');
    function compose(){
      const width=innerWidth,height=innerHeight,stacked=stackedLayout.matches;
      direction.set(stacked?-1.2:-1.4,stacked?3.2:4.15,stacked?19.7:16.9).normalize();
      function frameBounds(bound,index){
        const center=bound.getCenter(new THREE.Vector3());
        const area=sceneArea(index);
        const corners=[];
        for(const x of [bound.min.x,bound.max.x])for(const y of [bound.min.y,bound.max.y])for(const z of [bound.min.z,bound.max.z])corners.push(new THREE.Vector3(x,y,z));
        let distance=20,projected;
        camera.clearViewOffset();
        const project=()=>{
          camera.position.copy(center).addScaledVector(direction,distance);camera.lookAt(center);camera.updateMatrixWorld();
          const points=corners.map(corner=>corner.clone().project(camera));
          const xs=points.map(p=>(p.x+1)*width/2),ys=points.map(p=>(1-p.y)*height/2);
          return{left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
        };
        for(let pass=0;pass<7;pass++){
          projected=project();const ratio=Math.max((projected.right-projected.left)/area.width,(projected.bottom-projected.top)/area.height);
          distance*=ratio;if(Math.abs(ratio-1)<.002)break;
        }
        distance*=index===2?1.07:1.025;projected=project();
        return{center,distance,offsetX:width/2-(area.left+area.width/2)+(projected.left+projected.right-width)/2,offsetY:height/2-(area.top+area.height/2)+(projected.top+projected.bottom-height)/2,area};
      }
      compositions=bounds.map(frameBounds);expandedCompositions=expandedBounds.map(frameBounds);
    }
    function resize(){
      if(cleaned||destroyed||!visible)return;
      renderer.setPixelRatio(Math.min(devicePixelRatio,stackedLayout.matches?1:1.5));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=stackedLayout.matches?45:42;camera.updateProjectionMatrix();skyMaterial.uniforms.uMobile.value=stackedLayout.matches?1:0;starMaterial.uniforms.uDpr.value=renderer.getPixelRatio();compose();request();
    }
    function tick(now){
      frame=0;if(!canDraw())return;
      const delta=Math.min((now-previous)/1000,.055);previous=now;if(motion)elapsed+=delta;
      const p=progress,index=Math.min(4,Math.floor(p)),fraction=p-index;
      point.copy(path[index]).lerp(path[index+1],fraction);
      yaw=motion?THREE.MathUtils.damp(yaw,targetYaw,7,delta):targetYaw;pitch=motion?THREE.MathUtils.damp(pitch,targetPitch,7,delta):targetPitch;
      worlds.forEach((world,i)=>{
        world.group.visible=Math.abs(i-p)<.999;
        if(!world.group.visible)return;
        world.group.rotation.y=yaw+Math.sin(elapsed*.10+i)*.035;world.group.rotation.x=pitch;
        world.update(elapsed,motion?delta:1,states[i]);
      });
      const travel=Math.sin(fraction*Math.PI),from=compositions[index],to=compositions[index+1];
      const openFrom=expandedCompositions[index],openTo=expandedCompositions[index+1];
      const expansionFrom=worlds[index].expansion||0,expansionTo=worlds[index+1].expansion||0;
      const blend=(key)=>THREE.MathUtils.lerp(THREE.MathUtils.lerp(from[key],openFrom[key],expansionFrom),THREE.MathUtils.lerp(to[key],openTo[key],expansionTo),fraction);
      const distance=blend('distance')+travel*10;
      fromCenter.copy(from.center).lerp(openFrom.center,expansionFrom);toCenter.copy(to.center).lerp(openTo.center,expansionTo);
      look.copy(fromCenter).lerp(toCenter,fraction).add(point);
      camera.position.copy(look).addScaledVector(direction,distance);camera.position.y+=travel*2.2;camera.lookAt(look);
      camera.setViewOffset(innerWidth,innerHeight,blend('offsetX')*(1-travel*.45),blend('offsetY')*(1-travel*.35),innerWidth,innerHeight);
      key.position.set(point.x-8,point.y+13,point.z+12);key.target.position.copy(point);key.target.updateMatrixWorld();
      rim.position.set(point.x+8,point.y+4,point.z-4);rim.target.position.copy(point);rim.target.updateMatrixWorld();warm.position.set(point.x,point.y+2,point.z+6);
      skyMaterial.uniforms.uBase.value.copy(themeBases[index]).lerp(themeBases[index+1],fraction);
      skyMaterial.uniforms.uGlow.value.copy(themeGlows[index]).lerp(themeGlows[index+1],fraction);skyMaterial.uniforms.uTime.value=elapsed;
      starMaterial.uniforms.uTime.value=elapsed;starMaterial.uniforms.uBlock.value=1-Math.min(1,p);
      renderer.render(scene,camera);
      sceneHost.dataset.ready='true';sceneHost.dataset.drawCalls=String(renderer.info.render.calls);sceneHost.dataset.triangles=String(renderer.info.render.triangles);sceneHost.dataset.renderedWorld=chapters[active].id;sceneHost.dataset.progress=p.toFixed(4);sceneHost.dataset.time=elapsed.toFixed(4);status.textContent='';
      if(motion&&canDraw())frame=requestAnimationFrame(tick);
    }
    function request(){
      if(!canDraw()){cancelAnimationFrame(frame);frame=0;return;}
      if(frame)return;previous=performance.now();frame=requestAnimationFrame(tick);
    }
    rendererController={request,resize,stop(){drag=null;cancelAnimationFrame(frame);frame=0;},rotate(){targetYaw+=Math.PI/8;request();}};
    listen(window,'resize',resize,{passive:true});
    listen(window,'pointerdown',event=>{
      if(!visible||destroyed||event.button!==0||!event.isPrimary||event.target.closest('button,a,dialog,.chapter-copy')||root.querySelector('dialog[open]'))return;
      mouse.set(event.clientX/innerWidth*2-1,-event.clientY/innerHeight*2+1);raycaster.setFromCamera(mouse,camera);
      if(!raycaster.intersectObject(worlds[active].group,true).length)return;
      drag={x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,world:active,moved:false,type:event.pointerType};
    },{passive:true});
    listen(window,'pointermove',event=>{
      if(!visible||destroyed||!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(Math.abs(event.clientX-drag.startX)+Math.abs(event.clientY-drag.startY)>7)drag.moved=true;
      if(drag.type==='touch'&&Math.abs(event.clientY-drag.startY)>Math.abs(event.clientX-drag.startX)){drag=null;return;}
      targetYaw+=dx*.005;targetPitch=Math.max(-.35,Math.min(.35,targetPitch+dy*.003));drag.x=event.clientX;drag.y=event.clientY;request();
    },{passive:true});
    listen(window,'pointerup',()=>{if(drag&&!drag.moved&&drag.world===active)activateWorld(active);drag=null;});
    listen(window,'pointercancel',()=>{drag=null;});
    listen(document,'visibilitychange',request);
    listen(window,'pagehide',()=>{suspended=true;request();});listen(window,'pageshow',()=>{suspended=false;request();});
    listen(renderer.domElement,'webglcontextlost',event=>{
      event.preventDefault();stopped=true;cancelAnimationFrame(frame);renderer.domElement.hidden=true;sceneHost.dataset.ready='false';sceneHost.dataset.fallback='true';layoutScenePoster();root.querySelector('#inspect-button').hidden=true;status.textContent='Static view. The whole journey is still here.';
    });
    resize();request();document.fonts.ready.then(resize);
  }catch(error){
    graphicsCleanup();
    if(destroyed)return;
    console.warn('The journey is using its rendered previews.',error);sceneHost.dataset.fallback='true';sceneHost.dataset.ready='false';layoutScenePoster();root.querySelector('#inspect-button').hidden=true;status.textContent='Static view. The whole journey is still here.';
  }
}
startUniverse();

return {
  setVisible(value) {
    if(destroyed||visible===value)return;
    visible=value;
    if(!visible){
      cancelAnimationFrame(uiFrame);uiFrame=0;rendererController?.stop();
      for(const dialog of [storyDialog,mapDialog])if(dialog.open)dialog.close();
      document.documentElement.classList.remove('journey-dialog-open');
      window.history.scrollRestoration=scrollRestoration;
      sceneHost.dataset.rendering='paused';
      return;
    }
    window.history.scrollRestoration='manual';
    const chapter=journeyChapterFromHash(location.hash);
    const index=chapters.findIndex(item=>item.id===chapter);
    goTo(index<0?active:index,{instant:true,history:false});updateUI();
    rendererController?.resize();rendererController?.request();
    sceneHost.dataset.rendering=motion?'continuous':'on-demand';
  },
  setMotion(value,locked){
    motion=value;motionLocked=locked;updateMotion();
    sceneHost.dataset.rendering=visible?(motion?'continuous':'on-demand'):'paused';
  },
  destroy(){
    if(destroyed)return;
    destroyed=true;visible=false;events.abort();unsubscribeRoute();
    cancelAnimationFrame(uiFrame);rendererController?.stop();graphicsCleanup();
    for(const dialog of [storyDialog,mapDialog])if(dialog.open)dialog.close();
    document.documentElement.classList.remove('journey-dialog-open');
    window.history.scrollRestoration=scrollRestoration;
    journey.replaceChildren();controls.replaceChildren();
  }
};
}
