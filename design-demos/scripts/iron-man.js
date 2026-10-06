import * as THREE from 'three';
import { mergeGeometries } from '../vendor/utils/BufferGeometryUtils.js';
import { GLTFLoader } from '../vendor/loaders/GLTFLoader.js';

// Iron-Man Mark 85 by 9A Films / Nihar Arora, CC BY 4.0.
// Model optimized and divided into rigid armor sections for this experience.
// Full source, license, and modification details: assets/iron-man/CREDITS.md.
export async function buildIronMan() {
  const {scene:asset}=await new GLTFLoader().loadAsync(new URL('../assets/iron-man/suit.glb',import.meta.url).href);
  const group=new THREE.Group(),model=new THREE.Group(),parts=[];group.add(model);
  const materials=new Set();
  asset.traverse(object=>{if(object.isMesh)materials.add(object.material);});
  for(const material of materials){
    material.side=THREE.FrontSide;
    if(material.name==='Red_Part'){
      material.metalness=.92;material.roughness=.73;
      material.envMapIntensity=1.15;
    }else if(material.name==='Gold_Part'){
      material.metalness=1;material.roughness=.82;material.envMapIntensity=1.05;
    }else if(material.name==='Silver_Part'){
      material.metalness=.9;material.roughness=.88;material.color.set('#8993a0');
    }else if(material.name==='Lights'){
      material.emissive.set('#b7e9ff');material.emissiveIntensity=2.5;
      material.toneMapped=false;
    }
  }
  function release(name,center){
    const side=name.startsWith('Right')?-1:1;
    if(name==='Faceplate')return{move:[-.88,.87,1.12],turn:[-.13,-.23,.08],delay:0};
    if(name==='Helmet')return{move:[.25,1.0,-.55],turn:[-.13,.18,.02],delay:.05};
    if(name==='Chest armor')return{move:[-.76,.35,1.48],turn:[-.04,-.3,.05],delay:.10};
    if(name.includes('chest'))return{move:[side*.88,.2,1.02],turn:[.04,side*.22,-side*.11],delay:.10};
    if(name==='Back armor')return{move:[0,.2,-1.10],turn:[.1,0,0],delay:.15};
    if(name.includes('shoulder'))return{move:[side*.91,.53,.1],turn:[.08,side*.1,-side*.3],delay:.07};
    if(name.includes('upper arm'))return{move:[side*.90,.2,.35],turn:[0,side*.12,-side*.12],delay:.15};
    if(name.includes('forearm'))return{move:[side*1.05,.03,.72],turn:[.05,side*.15,-side*.14],delay:.21};
    if(name.includes('gauntlet'))return{move:[side*1.1,-.29,.91],turn:[.04,-side*.12,-side*.12],delay:.27};
    if(name.startsWith('Abdomen')){
      const row=name.endsWith('upper')?0:name.endsWith('middle')?1:2;
      return{move:[row===1?-.46:.46,.02-row*.08,1.0+row*.13],turn:[.07,0,row===1?.1:-.1],delay:.17+row*.04};
    }
    if(name==='Pelvic shield')return{move:[0,-.26,.95],turn:[.1,0,0],delay:.28};
    if(name.includes('hip'))return{move:[side*.64,-.08,.57],turn:[0,side*.18,-side*.13],delay:.22};
    if(name.includes('thigh'))return{move:[side*.83,-.05,.38],turn:[.02,side*.18,-side*.08],delay:.25};
    if(name.includes('knee'))return{move:[side*.92,-.11,1.05],turn:[.12,side*.12,side*.08],delay:.30};
    if(name.includes('shin'))return{move:[side*1.02,-.1,.48],turn:[.04,side*.14,side*.08],delay:.34};
    if(name.includes('boot'))return{move:[side*.78,-.48,.73],turn:[.1,side*.1,side*.03],delay:.39};
    return{move:[Math.sign(center.x)*.75,0,.8],turn:[0,0,0],delay:.2};
  }
  for(const object of [...asset.children]){
    const name=object.name.replaceAll('_',' ');
    const item=new THREE.Group();item.name=name;
    const box=new THREE.Box3().setFromObject(object),center=box.getCenter(new THREE.Vector3());
    item.position.copy(center);object.position.sub(center);item.add(object);model.add(item);
    if(name==='Internal frame')continue;
    const {move,turn,delay}=release(name,center);
    parts.push({item,home:center.clone(),away:new THREE.Vector3(...move),rest:item.quaternion.clone(),open:new THREE.Quaternion().setFromEuler(new THREE.Euler(...turn)),delay});
  }
  buildInnerFrame(model);
  let separation=0;
  const world={group,model,explodedView:true,expansion:0,update(time,delta,state){
    const target=state.active?1:0;
    separation=delta>=1?target:THREE.MathUtils.damp(separation,target,4.2,delta);
    if(Math.abs(separation-target)<.0005)separation=target;
    world.expansion=THREE.MathUtils.smoothstep(separation,0,1);
    for(const {item,home,away,rest,open,delay} of parts){
      const travel=THREE.MathUtils.smoothstep(separation,delay,1);
      item.position.copy(home).addScaledVector(away,travel);item.quaternion.copy(rest).slerp(open,travel);
    }
    model.rotation.set(0,-.12-world.expansion*.10,0);
  }};
  world.update(0,1,{active:false});return world;
}


// Original internal fittings fill the hollow armor during the release sequence.
// They sit within the source silhouette and are batched by material.
function buildInnerFrame(model){
  const metal=new THREE.MeshStandardMaterial({color:'#323b46',metalness:.88,roughness:.37});
  const rubber=new THREE.MeshStandardMaterial({color:'#111820',metalness:.15,roughness:.67});
  const steel=new THREE.MeshStandardMaterial({color:'#79828a',metalness:.95,roughness:.3});
  const batches=new Map(),cylinder=new THREE.CylinderGeometry(1,1,1,12),sphere=new THREE.SphereGeometry(1,16,10);
  function shape(geometry,material,position,scale,quaternion=new THREE.Quaternion()){
    const transform=new THREE.Matrix4().compose(new THREE.Vector3(...position),quaternion,new THREE.Vector3(...scale));
    const g=geometry.clone().applyMatrix4(transform);
    if(!batches.has(material))batches.set(material,[]);batches.get(material).push(g);
  }
  function rod(a,b,radius,material){
    const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),d=to.clone().sub(from);
    shape(cylinder,material,from.add(to).multiplyScalar(.5).toArray(),[radius,d.length(),radius],new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));
  }
  shape(sphere,rubber,[0,1.65,-.10],[.56,.75,.28]);
  shape(sphere,metal,[0,1.94,.1],[.37,.38,.30]);
  rod([0,.05,-.19],[0,2.51,-.19],.12,steel);
  rod([0,2.41,-.05],[0,2.81,-.05],.13,metal);
  shape(sphere,rubber,[0,3.16,-.03],[.24,.38,.21]);
  for(let i=0;i<6;i++){
    const y=.53+i*.17,width=.31+i*.035;
    for(const side of [-1,1])rod([side*.09,y,-.0],[side*width,y+.10,.04],.045,metal);
  }
  shape(sphere,rubber,[0,.15,-.03],[.41,.35,.26]);
  for(const side of [-1,1]){
    const shoulder=[side*.86,2.20,-.12],elbow=[side*1.39,1.34,-.1],wrist=[side*1.84,.50,.15];
    rod([side*.2,2.19,-.15],shoulder,.11,metal);
    rod(shoulder,elbow,.13,rubber);rod(elbow,wrist,.09,rubber);
    shape(sphere,metal,elbow,[.14,.14,.14]);
    rod([side*.98,2.1,-.08],[side*1.35,1.43,-.06],.045,steel);
    rod([side*1.44,1.25,-.03],[side*1.79,.61,.14],.035,steel);
    const hip=[side*.40,.12,-.01],knee=[side*.50,-1.55,-.09],ankle=[side*.55,-3.20,-.18];
    rod(hip,knee,.15,rubber);rod(knee,ankle,.11,rubber);
    shape(sphere,metal,hip,[.18,.19,.18]);shape(sphere,metal,knee,[.17,.17,.16]);
    rod([side*.48,-.02,.12],[side*.57,-1.4,.08],.055,steel);
    rod([side*.55,-1.76,.02],[side*.60,-3.05,-.07],.047,steel);
  }
  const frame=new THREE.Group();frame.name='Support structure';model.add(frame);
  for(const [material,geometries] of batches){frame.add(new THREE.Mesh(mergeGeometries(geometries),material));geometries.forEach(g=>g.dispose());}
  cylinder.dispose();sphere.dispose();
}
