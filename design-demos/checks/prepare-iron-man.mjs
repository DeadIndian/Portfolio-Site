import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptSimplifier } from 'meshoptimizer';
const demoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.resolve(demoRoot,'..','.workshop/journey-review'),out=path.join(demoRoot,'assets/iron-man');
if(!process.argv[2])throw new Error('Pass the persistent path to the credited source GLB.');
await fs.mkdir(root,{recursive:true});
await fs.mkdir(out,{recursive:true});await MeshoptSimplifier.ready;
const file=await fs.readFile(process.argv[2]);
if(createHash('sha256').update(file).digest('hex')!=='56c8e2be80c8ecc1216afd83858d82c92824bc14bf023685b1a8baaf15afc017')throw new Error('Unexpected source asset; review its provenance and layout before converting.');
const jsonLength=file.readUInt32LE(12),original=JSON.parse(file.subarray(20,20+jsonLength)),json=structuredClone(original);
const sourceBin=file.subarray(28+jsonLength);
for(const m of json.materials){delete m.normalTexture;delete m.emissiveTexture;delete m.pbrMetallicRoughness.baseColorTexture;delete m.pbrMetallicRoughness.metallicRoughnessTexture;}
delete json.images;delete json.textures;
function packGLB(doc,binary){
 const data=Buffer.from(JSON.stringify(doc)),j=Buffer.alloc(Math.ceil(data.length/4)*4,32);data.copy(j);
 const bin=Buffer.alloc(Math.ceil(binary.length/4)*4);binary.copy(bin);
 const header=Buffer.alloc(20);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+j.length+bin.length,8);header.writeUInt32LE(j.length,12);header.writeUInt32LE(0x4e4f534a,16);
 const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);return Buffer.concat([header,j,bh,bin]);
}
const simple=packGLB(json,sourceBin),gltf=await new GLTFLoader().parseAsync(simple.buffer.slice(simple.byteOffset,simple.byteOffset+simple.length),'');
gltf.scene.updateMatrixWorld(true);
const bounds=new THREE.Box3().setFromObject(gltf.scene),center=bounds.getCenter(new THREE.Vector3()),scale=7.4/(bounds.max.y-bounds.min.y);
const materialGroups=new Map(),point=new THREE.Vector3(),normal=new THREE.Vector3();
gltf.scene.traverse(mesh=>{
 if(!mesh.isMesh||mesh.material.name==='Glass')return;
 mesh.skeleton?.update();
 const geom=mesh.geometry,index=geom.index.array,pos=geom.attributes.position,norm=geom.attributes.normal,uv=geom.attributes.uv;
 const name=mesh.material.name;
 if(!materialGroups.has(name))materialGroups.set(name,{positions:[],normals:[],uvs:[],indices:[]});
 const data=materialGroups.get(name),base=data.positions.length/3,nm=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
 for(let i=0;i<pos.count;i++){
  mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld).sub(center).multiplyScalar(scale);data.positions.push(point.x,point.y,point.z);
  normal.fromBufferAttribute(norm,i).applyNormalMatrix(nm);data.normals.push(normal.x,normal.y,normal.z);data.uvs.push(uv.getX(i),uv.getY(i));
 }
 for(const i of index)data.indices.push(i+base);
});
function classify(name,x,y,z){
 if(name==='Silver_Part'||name==='Arc_Reactor')return 'Internal frame';
 const side=x<0?'Right':'Left',a=Math.abs(x);
 if(y>2.65)return name==='Gold_Part'||name==='Lights'?'Faceplate':'Helmet';
 if(a>.76&&y>1.95)return side+' shoulder';
 if(a>.96&&y>1.13)return side+' upper arm';
 if(a>1.13&&y>.34)return side+' forearm';
 if(a>1.30)return side+' gauntlet';
 if(y>1.28){if(name==='Lights')return 'Internal frame';return z<-.06?'Back armor':side+' chest';}
 if(y>.32){if(z<-.14)return 'Back armor';return 'Abdomen '+(y>1.02?'upper':y>.66?'middle':'lower');}
 if(y>-.40)return a>.47?side+' hip':'Pelvic shield';
 if(y>-1.35)return side+' thigh';
 if(y>-1.76)return side+' knee';
 if(y>-3.04)return side+' shin';
 return side+' boot';
}
const pieces=new Map(),reports=[];
for(const [name,data] of materialGroups){
 const count=data.positions.length/3,parents=new Uint32Array(count),weld=new Map();
 for(let i=0;i<count;i++)parents[i]=i;
 const find=x=>{while(parents[x]!==x){parents[x]=parents[parents[x]];x=parents[x];}return x;};
 const union=(a,b)=>{a=find(a);b=find(b);if(a!==b)parents[b]=a;};
 for(let i=0;i<count;i++){const key=[0,1,2].map(k=>Math.round(data.positions[i*3+k]*10000)).join(',');if(weld.has(key))union(i,weld.get(key));else weld.set(key,i);}
 for(let i=0;i<data.indices.length;i+=3){union(data.indices[i],data.indices[i+1]);union(data.indices[i],data.indices[i+2]);}
 const components=new Map();
 for(let i=0;i<data.indices.length;i+=3){const id=find(data.indices[i]);if(!components.has(id))components.set(id,[]);components.get(id).push(...data.indices.slice(i,i+3));}
 let largest=[];
 for(const indices of components.values()){
  const box=new THREE.Box3();for(const i of indices)box.expandByPoint(point.fromArray(data.positions,i*3));
  const c=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  const split=false;
  largest.push({triangles:indices.length/3,center:c.toArray().map(x=>+x.toFixed(2)),size:size.toArray().map(x=>+x.toFixed(2)),split});
  for(let i=0;i<indices.length;i+=3){
   if(split){point.set(0,0,0);for(let n=0;n<3;n++)point.add(normal.fromArray(data.positions,indices[i+n]*3));point.multiplyScalar(1/3);}else point.copy(c);
   const part=name==='Red_Part'&&c.y>1.5&&c.z>.1&&size.x>1.25?'Chest armor':classify(name,point.x,point.y,point.z),key=part+'|'+name;
   if(!pieces.has(key))pieces.set(key,{part,name,source:data,indices:[]});pieces.get(key).indices.push(indices[i],indices[i+1],indices[i+2]);
  }
 }
 largest.sort((a,b)=>b.triangles-a.triangles);reports.push({material:name,components:components.size,largest:largest.slice(0,12)});
}
const doc={asset:original.asset,scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:structuredClone(original.materials.slice(0,5)),textures:original.textures,images:[],samplers:original.samplers,accessors:[],bufferViews:[],buffers:[{byteLength:0}],extensionsUsed:original.extensionsUsed};
const chunks=[];let byteLength=0,triangles=0;
function bufferView(array){const raw=Buffer.from(array.buffer,array.byteOffset,array.byteLength),b=Buffer.alloc(Math.ceil(raw.length/4)*4);raw.copy(b);const id=doc.bufferViews.length;doc.bufferViews.push({buffer:0,byteOffset:byteLength,byteLength:raw.length});chunks.push(b);byteLength+=b.length;return id;}
function accessor(array,type,componentType,min,max){const id=doc.accessors.length;doc.accessors.push({bufferView:bufferView(array),componentType,count:array.length/({VEC3:3,VEC2:2,SCALAR:1}[type]),type,...(min?{min,max}:{})});return id;}
const nodes=new Map(),budgets={Silver_Part:.095,Arc_Reactor:.027,Gold_Part:.27,Red_Part:.19,Lights:.25};
for(const piece of pieces.values()){
 const {part,name,source}=piece,oldToNew=new Map(),positions=[],normals=[],uvs=[],indices=[];
 for(const old of piece.indices){if(!oldToNew.has(old)){oldToNew.set(old,positions.length/3);positions.push(...source.positions.slice(old*3,old*3+3));normals.push(...source.normals.slice(old*3,old*3+3));uvs.push(...source.uvs.slice(old*2,old*2+2));}indices.push(oldToNew.get(old));}
 const ps=new Float32Array(positions),attrs=new Float32Array(positions.length/3*5);
 for(let i=0;i<positions.length/3;i++){attrs.set(normals.slice(i*3,i*3+3),i*5);attrs.set(uvs.slice(i*2,i*2+2),i*5+3);}
 const goal=Math.max(24,Math.floor(indices.length*budgets[name]/3)*3);
 const [simplified,error]=MeshoptSimplifier.simplifyWithAttributes(new Uint32Array(indices),ps,3,attrs,5,[.05,.05,.05,.2,.2],null,goal,.018,['Permissive']);
 const [remap,vertexCount]=MeshoptSimplifier.compactMesh(simplified),p=new Float32Array(vertexCount*3),n=new Float32Array(vertexCount*3),u=new Float32Array(vertexCount*2);
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<remap.length;i++){const to=remap[i];if(to===0xffffffff)continue;for(let k=0;k<3;k++){p[to*3+k]=positions[i*3+k];n[to*3+k]=normals[i*3+k];min[k]=Math.min(min[k],p[to*3+k]);max[k]=Math.max(max[k],p[to*3+k]);}u[to*2]=uvs[i*2];u[to*2+1]=uvs[i*2+1];}
 const primitive={attributes:{POSITION:accessor(p,'VEC3',5126,min,max),NORMAL:accessor(n,'VEC3',5126),TEXCOORD_0:accessor(u,'VEC2',5126)},indices:accessor(vertexCount<65536?new Uint16Array(simplified):simplified,'SCALAR',vertexCount<65536?5123:5125),material:doc.materials.findIndex(m=>m.name===name)};
 if(!nodes.has(part)){const meshId=doc.meshes.length,nodeId=doc.nodes.length;doc.meshes.push({name:part,primitives:[]});doc.nodes.push({name:part,mesh:meshId});doc.scenes[0].nodes.push(nodeId);nodes.set(part,meshId);}
 doc.meshes[nodes.get(part)].primitives.push(primitive);triangles+=simplified.length/3;
 console.log(part,name,indices.length/3,'→',simplified.length/3,'error',error.toFixed(4));
}
for(let i=0;i<original.images.length;i++){
 const view=original.bufferViews[original.images[i].bufferView],image=sourceBin.subarray(view.byteOffset,view.byteOffset+view.byteLength);
 const name=`texture-${i}.webp`,isNormal=[2,5,8,11].includes(i);
 await sharp(image).resize({width:isNormal?1536:2048,height:isNormal?1536:2048,fit:'inside',withoutEnlargement:true}).webp({quality:isNormal?94:88}).toFile(path.join(out,name));doc.images.push({uri:name});
}
doc.buffers[0].byteLength=byteLength;const output=packGLB(doc,Buffer.concat(chunks));await fs.writeFile(path.join(out,'suit.glb'),output);
await fs.writeFile(path.join(root,'components.json'),JSON.stringify(reports,null,2));
await fs.writeFile(path.join(root,'model-report.json'),JSON.stringify({source:original.asset.extras,triangles,parts:[...nodes.keys()],modelBytes:output.length},null,2));
console.log('MODEL',triangles,'triangles',nodes.size,'parts',output.length,'bytes');
