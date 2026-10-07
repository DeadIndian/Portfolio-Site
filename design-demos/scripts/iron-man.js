import * as THREE from 'three';
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
