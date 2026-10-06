import * as THREE from 'three';
import { buildIronMan } from './iron-man.js';

const TAU = Math.PI * 2;
const geometryCache = new Map();
const materialCache = new Map();
const geometry = (key, make) => { if (!geometryCache.has(key)) geometryCache.set(key, make()); return geometryCache.get(key); };
const boxGeometry = () => geometry('box', () => new THREE.BoxGeometry(1, 1, 1));
const sphereGeometry = (detail = 24) => geometry(`sphere-${detail}`, () => new THREE.SphereGeometry(1, detail, Math.round(detail * .65)));
const torusGeometry = (radius, tube, segments = 80) => geometry(`torus-${radius}-${tube}-${segments}`, () => new THREE.TorusGeometry(radius, tube, 8, segments));
const cylinderGeometry = (top, bottom, height, segments = 24) => geometry(`cylinder-${top}-${bottom}-${height}-${segments}`, () => new THREE.CylinderGeometry(top, bottom, height, segments));
const quat = new THREE.Quaternion(), euler = new THREE.Euler(), vector = new THREE.Vector3(), scaleVector = new THREE.Vector3();

function randomSource(seed = 12) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
function material(color, metalness = 0, roughness = .65) {
  const key = `${color}-${metalness}-${roughness}`;
  if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({ color, metalness, roughness }));
  return materialCache.get(key);
}
function emissive(color, intensity = 1) { return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), toneMapped: false }); }
function mesh(parent, geo, mat, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const item = new THREE.Mesh(geo, mat);
  item.position.set(...position); item.rotation.set(...rotation); item.scale.set(...scale);
  parent.add(item); return item;
}
function box(parent, dimensions, color, position, rotation = [0, 0, 0], metalness = 0, roughness = .7) {
  return mesh(parent, boxGeometry(), typeof color === 'string' ? material(color, metalness, roughness) : color, position, rotation, dimensions);
}
function ball(parent, radius, color, position, metalness = 0, roughness = .6) {
  return mesh(parent, sphereGeometry(), typeof color === 'string' ? material(color, metalness, roughness) : color, position, [0, 0, 0], [radius, radius, radius]);
}
function tube(parent, points, color, radius = .016, metalness = 0) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return mesh(parent, new THREE.TubeGeometry(curve, 32, radius, 5, false), material(color, metalness, .5));
}
function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function label(parent, text, width, height, position, color = '#dce9de', background = null) {
  const texture = canvasTexture(512, 128, (ctx, w, h) => {
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, w, h); }
    ctx.fillStyle = color; ctx.font = '500 42px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w / 2, h / 2);
  });
  return mesh(parent, new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide }), position);
}
const glowTexture = canvasTexture(128, 128, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(255,255,255,.98)'); g.addColorStop(.09, 'rgba(255,255,255,.7)'); g.addColorStop(.26, 'rgba(255,255,255,.17)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
});
function glow(parent, color, size, position, opacity = .65) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  sprite.position.set(...position); sprite.scale.set(size, size, 1); parent.add(sprite); return sprite;
}
function ring(parent, radius, color, position = [0, 0, 0], rotation = [0, 0, 0], tubeSize = .013) {
  return mesh(parent, torusGeometry(radius, tubeSize, 120), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .5, depthWrite: false }), position, rotation);
}
function world() {
  const group = new THREE.Group(), model = new THREE.Group(); group.add(model);
  return { group, model, update() {}, action() {} };
}

// The same textured cube geometry is instanced throughout the voxel world.
const voxelTexture = canvasTexture(32, 32, (ctx) => {
  const random = randomSource(106);
  for (let y = 0; y < 32; y += 4) for (let x = 0; x < 32; x += 4) {
    const v = 182 + Math.floor(random() * 74); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(x, y, 4, 4);
  }
});
voxelTexture.magFilter = THREE.NearestFilter; voxelTexture.minFilter = THREE.NearestFilter;
const voxelMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', map: voxelTexture, roughness: 1, metalness: 0 });
function voxelBatch(parent) {
  const entries = [];
  return {
    cube(position, dimensions, color, rotation = [0, 0, 0]) { entries.push({ position, dimensions, color, rotation }); },
    finish() {
      const instanced = new THREE.InstancedMesh(boxGeometry(), voxelMaterial, entries.length);
      entries.forEach((entry, i) => {
        euler.set(...entry.rotation); quat.setFromEuler(euler);
        const matrix = new THREE.Matrix4().compose(vector.set(...entry.position), quat, scaleVector.set(...entry.dimensions));
        instanced.setMatrixAt(i, matrix); instanced.setColorAt(i, new THREE.Color(entry.color));
      });
      instanced.instanceMatrix.needsUpdate = true; instanced.instanceColor.needsUpdate = true; instanced.computeBoundingSphere(); parent.add(instanced); return instanced;
    }
  };
}

function buildBlocks() {
  const w = world(), root = w.model, batch = voxelBatch(root), random = randomSource(931);
  root.rotation.y = -.42;
  const soil = ['#78513c', '#866046', '#684837', '#977354'];
  const grass = ['#699c49', '#79af50', '#86b75b', '#6da44b'];
  for (let x = -8; x <= 8; x++) for (let z = -6; z <= 6; z++) {
    const distance = Math.sqrt((x / 8.4) ** 2 + (z / 6.6) ** 2);
    if (distance > 1) continue;
    const top = z < -2 && Math.abs(x) > 4 ? .52 : 0;
    for (let depth = 0; depth < 7; depth++) {
      if (distance > 1 - depth * .10) continue;
      batch.cube([x * .49, top - depth * .49, z * .49], [.49, .49, .49], depth > 3 ? ['#656765', '#555952', '#727370'][Math.floor(random() * 3)] : soil[Math.floor(random() * soil.length)]);
    }
    batch.cube([x * .49, top + .255, z * .49], [.49, .06, .49], grass[Math.floor(random() * grass.length)]);
  }
  // A small timber house with a stepped roof, beams, windows, and a chimney.
  batch.cube([-.8, 1.0, -1.15], [2.15, 1.48, 1.72], '#c3ae78');
  for (const x of [-1.87, .27]) for (const z of [-2.01, -.29]) batch.cube([x, 1.01, z], [.15, 1.6, .15], '#71513a');
  for (let n = 0; n < 5; n++) batch.cube([-.8, 1.87 + n * .22, -1.15], [2.74 - n * .49, .24, 2.10], n % 2 ? '#875339' : '#9b6240');
  batch.cube([-.6, .90, -.25], [.42, 1.12, .05], '#6b4a2e');
  for (const x of [-1.39, -.02]) {
    batch.cube([x, 1.17, -.245], [.40, .44, .05], '#3a514d');
    box(root, [.28, .31, .04], emissive('#ffc671', .8), [x, 1.17, -.205]);
    batch.cube([x, 1.17, -.175], [.035, .36, .04], '#f6dba4');
  }
  batch.cube([-.07, 2.58, -1.6], [.40, .9, .4], '#8f8072');
  batch.cube([-.07, 3.03, -1.6], [.51, .13, .51], '#b2a294');
  // Crops surround an irrigation channel, which runs off the edge of the island.
  batch.cube([.18, .315, 1.40], [.28, .10, 2.7], '#32898c');
  const cropRoot = new THREE.Group(); cropRoot.position.y = .37; root.add(cropRoot);
  const crops = voxelBatch(cropRoot);
  for (let row = 0; row < 5; row++) for (let column = 0; column < 8; column++) {
    const x = column < 4 ? -1.87 + column * .33 : .62 + (column - 4) * .33;
    const z = .68 + row * .36;
    batch.cube([x, .30, z], [.30, .045, .30], '#604330');
    const height = .26 + random() * .19;
    crops.cube([x, height / 2, z], [.07, height, .07], '#a7b956');
    crops.cube([x, height - .02, z], [.15, .14, .12], '#d4bd62');
    crops.cube([x - .08, height * .56, z], [.05, .15, .05], '#80994a', [0, 0, -.5]);
  }
  crops.finish();
  for (const [x, z, size] of [[-2.95,-1.05,1],[-2.8,-2.33,.8],[2.55,-1.25,1.2],[1.5,-2.52,.76],[3.24,.5,.73]]) {
    const y = z < -1 && Math.abs(x) > 2 ? .50 : .26;
    batch.cube([x, y + size * .83, z], [.32, size * 1.65, .32], '#685039');
    batch.cube([x, y + size * 1.94, z], [1.50 * size, 1.06 * size, 1.40 * size], '#3d804d');
    batch.cube([x, y + size * 2.56, z], [.96 * size, .64 * size, .94 * size], '#559451');
    batch.cube([x + size * .45, y + size * 1.85, z + size * .29], [.64 * size, .73 * size, .68 * size], '#679e56');
  }
  // A little windmill is the farm's visible on/off mechanism.
  batch.cube([1.90, 1.30, -.13], [.40, 2.08, .40], '#bd9765');
  batch.cube([1.90, 2.41, -.13], [.73, .33, .62], '#7d6248');
  const mill = new THREE.Group(); mill.position.set(1.90, 2.35, .25); root.add(mill);
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Group(); blade.rotation.z = i * Math.PI / 2; mill.add(blade);
    box(blade, [.09, 1.04, .08], '#75583e', [0, .50, 0]);
    box(blade, [.30, .63, .06], '#e9dcb5', [.09, .64, .045]);
  }
  box(mill, [.23, .23, .17], '#b98850', [0,0,.1]);
  // Fence and path fragments give the top a sense of scale.
  for (let i = 0; i < 6; i++) batch.cube([-2.31, .65, .45 + i * .38], [.10,.72,.10], '#b79363');
  batch.cube([-2.31,.77,1.36],[.075,.095,2.24],'#a38153');
  batch.cube([-2.31,.48,1.36],[.075,.095,2.24],'#a38153');
  for (let i = 0; i < 5; i++) batch.cube([-.60,.30,.01 + i * .20],[.37,.06,.18],'#c3b68c');
  const clouds = new THREE.Group(); root.add(clouds);
  const cloudBatch = voxelBatch(clouds);
  for (const [x,y,z] of [[-3.3,4.5,-1.8],[2.0,4.75,-2.2]]) {
    for (let i = 0; i < 4; i++) cloudBatch.cube([x + i * .44,y + (i % 3 === 1 ? .22 : 0),z],[.64,.32 + (i % 3) * .12,.48],'#e0eadf');
  }
  cloudBatch.finish(); batch.finish();
  const water = new THREE.Group(); root.add(water);
  const waterMaterial = new THREE.MeshStandardMaterial({ color: '#55bfc0', transparent: true, opacity: .78, roughness: .3, metalness: .25 });
  box(water, [.32, 3.1, .15], waterMaterial, [.18, -1.25, 3.07]);
  box(water, [.20, 2.4, .08], new THREE.MeshBasicMaterial({ color: '#bbefdb', transparent: true, opacity: .4 }), [.13,-1.0,3.17]);
  const drops = [];
  for (let i = 0; i < 9; i++) drops.push(box(root,[.08,.11,.08],emissive('#b9eadf',.7),[.09+random()*.25,-random()*3,3.15+random()*.1]));
  const smoke = [];
  for (let i = 0; i < 4; i++) smoke.push(box(root,[.17,.17,.17],new THREE.MeshStandardMaterial({color:'#dfe6d8',transparent:true,opacity:.18+i*.035}),[-.07,3.3+i*.31,-1.6]));
  let power = .2;
  w.update = (time, delta, state) => {
    power = THREE.MathUtils.damp(power, state.active ? 1 : .2, 3, delta);
    mill.rotation.z = -time * (state.active ? 1.1 : .10);
    cropRoot.scale.y = .63 + power * .37;
    water.scale.y = .8 + power * .2;
    clouds.position.x = Math.sin(time * .075) * .15;
    drops.forEach((drop, i) => { drop.position.y = .27 - ((time * (state.active ? 1.8 : .35) + i * .34) % 3.25); });
    smoke.forEach((part, i) => { part.position.y = 3.25 + (time * .18 + i * .33) % 1.3; part.position.x = -.07 + Math.sin(time * .3 + i) * .10; });
  };
  return w;
}

function shipHull() {
  const positions = [], indices = [], uvs = [], length = 5.0, steps = 24, rows = 12;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, z = (t - .5) * length;
    const width = Math.pow(Math.sin(t * Math.PI), .55) * 1.20 + .025;
    for (let j = 0; j <= rows; j++) {
      const angle = j / rows * Math.PI;
      positions.push(Math.cos(angle) * width, .22 - Math.sin(angle) * (.81 * Math.sin(t * Math.PI) + .06), z);
      uvs.push(t * 3, j / rows);
      if (i < steps && j < rows) {
        const a = i * (rows + 1) + j, b = a + rows + 1;
        indices.push(a,b,a+1,b,b+1,a+1);
      }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

function buildVoyage() {
  const w = world(), root = w.model; root.scale.setScalar(.86); root.position.y = -.45;
  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uWind: { value: .2 } },
    vertexShader: `uniform float uTime;uniform float uWind;varying vec3 vNormal;varying vec3 vPosition;void main(){vNormal=normalMatrix*normal;vPosition=position;float wave=sin(position.x*5.+uTime*.7)*sin(position.z*4.-uTime*.4)*(.013+uWind*.014);vec3 p=position+normal*wave;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `uniform float uTime;varying vec3 vNormal;varying vec3 vPosition;void main(){vec3 n=normalize(vNormal);float light=max(dot(n,normalize(vec3(-.6,.9,1.))),0.);vec3 color=mix(vec3(.005,.036,.075),vec3(.026,.29,.38),pow(light,.85));float waves=sin(vPosition.x*39.+sin(vPosition.z*18.)*2.+uTime*.6)*sin(vPosition.z*29.+vPosition.y*5.-uTime*.45);float sparkle=pow(max(waves,0.),12.)*pow(light,3.);color+=vec3(.15,.36,.34)*sparkle*.25;float edge=pow(1.-abs(n.z),3.);color+=vec3(.015,.10,.12)*edge;gl_FragColor=vec4(color,1.);
    #include <colorspace_fragment>
    }`
  });
  mesh(root, sphereGeometry(64), waterMaterial, [0,-1.65,0], [0,0,0], [3.8,3.8,3.8]);
  ring(root,4.32,'#d2be88',[0,-1.65,0],[.48,.32,-.1],.012);
  ring(root,4.47,'#638e95',[0,-1.65,0],[.48,.32,-.1],.005);
  // Short wave crests follow the curved sea, with two small palm coastlines.
  const crests=[],seaRandom=randomSource(74);
  for(let row=0;row<9;row++)for(let column=0;column<19;column++){
    const latitude=-1.22+row*.27+(seaRandom()-.5)*.09;
    const longitude=column/19*TAU+(seaRandom()-.5)*.16;
    for(let part=0;part<7;part++)for(const end of [part,part+1]){
      const a=longitude+end*.014,b=latitude+Math.sin(end*.50)*.004,r=3.824;
      crests.push(Math.cos(b)*Math.sin(a)*r,Math.sin(b)*r-1.65,Math.cos(b)*Math.cos(a)*r);
    }
  }
  const crestGeometry=new THREE.BufferGeometry();crestGeometry.setAttribute('position',new THREE.Float32BufferAttribute(crests,3));
  root.add(new THREE.LineSegments(crestGeometry,new THREE.LineBasicMaterial({color:'#a6d4cc',transparent:true,opacity:.14})));
  const leafGeometry=new THREE.BufferGeometry();leafGeometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.12,-.05,.23,.10,-.18,.53,0,-.28,.72,-.10,-.18,.53,-.12,-.05,.23],3));leafGeometry.setIndex([0,1,2,0,2,3,0,3,4,0,4,5]);leafGeometry.computeVertexNormals();
  const leafMaterial=new THREE.MeshStandardMaterial({color:'#4b8c61',roughness:.94,side:THREE.DoubleSide});
  for (const [islandIndex,[x,y,z,s]] of [[-2.40,.97,.82,.56],[2.48,.76,.82,.52],[-1.77,-.65,3.14,.33]].entries()) {
    const coast=new THREE.Group(),normal=new THREE.Vector3(x,y+1.65,z).normalize();
    coast.position.copy(normal).multiplyScalar(3.79);coast.position.y-=1.65;coast.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);root.add(coast);
    const island=ball(coast,s,'#cbb883',[0,0,0],0,.92);island.scale.set(s,s*.25,s*.80);
    const green=ball(coast,s*.73,'#5f8a59',[0,.05,0],0,.94);green.scale.y*=.22;
    if(islandIndex<2){
      tube(coast,[[0,.05,0],[.035,.39,0],[.16,.80,-.03]],'#95754b',.036);
      for(let i=0;i<6;i++)mesh(coast,leafGeometry,leafMaterial,[.16,.79,-.03],[0,i/6*TAU,0]);
    }
  }
  const ship = new THREE.Group(); ship.position.set(0,2.06,.08);ship.rotation.y=-.55;root.add(ship);
  const wood = canvasTexture(256,256,(ctx,w,h)=>{
    ctx.fillStyle='#ab7245';ctx.fillRect(0,0,w,h);const random=randomSource(87);
    for(let i=0;i<22;i++){ctx.strokeStyle=i%4===0?'#674b32':'#825b393d';ctx.lineWidth=i%4===0?3:1;ctx.beginPath();ctx.moveTo(0,i*12);ctx.lineTo(w,i*12+random()*3);ctx.stroke();}
  });wood.wrapS=wood.wrapT=THREE.RepeatWrapping;
  mesh(ship,shipHull(),new THREE.MeshStandardMaterial({map:wood,roughness:.72,side:THREE.DoubleSide}));
  const deckShape=new THREE.Shape();deckShape.moveTo(0,-2.48);deckShape.bezierCurveTo(-1.55,-1.7,-1.55,1.4,0,2.48);deckShape.bezierCurveTo(1.55,1.4,1.55,-1.7,0,-2.48);
  mesh(ship,new THREE.ShapeGeometry(deckShape,36),new THREE.MeshStandardMaterial({color:'#d6b47e',roughness:.8,side:THREE.DoubleSide}),[0,.24,0],[-Math.PI/2,0,0]);
  for(const side of [-1,1]){
    const points=[];
    for(let i=1;i<24;i++){const t=i/24;points.push([side*(Math.pow(Math.sin(t*Math.PI),.55)*1.20+.025),.36,(t-.5)*5]);}
    tube(ship,points,'#f1d7a0',.043);
    for(let i=2;i<23;i+=3){const t=i/24,x=side*Math.pow(Math.sin(t*Math.PI),.55)*1.20,z=(t-.5)*5;box(ship,[.045,.37,.045],'#f0d49d',[x,.4,z]);}
    const low=points.map(p=>[p[0]*.92,-.12,p[2]*.97]);tube(ship,low,'#e8c482',.035);
  }
  box(ship,[1.17,.73,1.10],'#a35c38',[0,.62,-1.26]);
  box(ship,[1.35,.16,1.28],'#6b9c94',[0,1.04,-1.26]);
  for(const x of [-.40,0,.40])box(ship,[.18,.23,.025],emissive('#e9cf90',.7),[x,.67,-.69]);
  mesh(ship,cylinderGeometry(.08,.12,4.7,14),material('#8f5e35',0,.78),[0,2.48,-.08]);
  mesh(ship,cylinderGeometry(.35,.25,.27,20),material('#b98850'),[0,4.57,-.08]);
  mesh(ship,torusGeometry(.37,.035,24),material('#efd0a0'),[0,4.72,-.08],[Math.PI/2,0,0]);
  // Painted sail emblem: an original straw-hat pirate motif.
  const sailTexture=canvasTexture(512,512,(ctx,w,h)=>{
    ctx.fillStyle='#eee3c8';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#d8ceb4';ctx.lineWidth=2;for(let x=20;x<w;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
    ctx.save();ctx.translate(256,266);ctx.strokeStyle='#37362b';ctx.lineWidth=14;ctx.lineCap='round';
    for(const direction of [-1,1]){ctx.beginPath();ctx.moveTo(-86,-44*direction);ctx.lineTo(86,66*direction);ctx.stroke();}
    ctx.fillStyle='#f8f3df';ctx.strokeStyle='#37362b';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(0,-10,65,63,0,0,TAU);ctx.fill();ctx.stroke();
    ctx.fillRect(-33,29,66,39);ctx.strokeRect(-33,29,66,39);ctx.fillStyle='#37362b';for(const x of [-24,24]){ctx.beginPath();ctx.ellipse(x,-10,15,18,0,0,TAU);ctx.fill();}
    ctx.beginPath();ctx.moveTo(0,10);ctx.lineTo(-7,24);ctx.lineTo(7,24);ctx.fill();
    ctx.fillStyle='#d8ac59';ctx.beginPath();ctx.ellipse(0,-62,88,18,0,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(0,-81,50,31,0,Math.PI,0);ctx.lineTo(50,-62);ctx.lineTo(-50,-62);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#ad4434';ctx.fillRect(-48,-72,96,13);ctx.restore();
  });
  const sailMaterial=new THREE.MeshStandardMaterial({map:sailTexture,roughness:.92,side:THREE.DoubleSide});
  const sailGeometry=new THREE.PlaneGeometry(2.78,2.76,24,20);
  const original=sailGeometry.attributes.position.array.slice();
  mesh(ship,sailGeometry,sailMaterial,[0,2.89,.11]);
  for(const y of [1.54,4.25])box(ship,[3.01,.075,.075],'#946a42',[0,y,.11]);
  const flag=mesh(ship,new THREE.PlaneGeometry(.72,.46,8,4),material('#ab4638',0,.9),[.42,4.83,-.08]);
  flag.material.side=THREE.DoubleSide;
  for(const x of [-1.05,1.05])for(const z of [-1.25,1.25])tube(ship,[[x,.43,z],[x*.53,2.50,z*.4],[0,4.32,-.08]],'#bfa57b',.012);
  box(ship,[.11,.11,1.45],'#d4b385',[0,.4,2.55],[.18,0,0]);
  // A sheep-like figurehead nods to the Going Merry without importing a model.
  ball(ship,.33,'#f0e7cc',[0,.46,2.53]);
  ball(ship,.24,'#ede3c8',[0,.55,2.78]);
  for(const x of [-.19,.19]){ball(ship,.045,'#323b37',[x,.59,2.92]);mesh(ship,torusGeometry(.14,.043,18),material('#b7a789'),[x*1.65,.64,2.61],[0,.3,0]);}
  ball(ship,.07,'#71695a',[0,.45,3.01]);
  for(const side of [-1,1])for(let i=0;i<3;i++)mesh(ship,cylinderGeometry(.055,.075,.4,10),material('#443e31',.4),[side*1.05,.27,-.75+i*.63],[0,0,Math.PI/2]);
  const foam=[];
  for(let i=0;i<7;i++){
    const wake=mesh(root,torusGeometry(.8+i*.18,.012,64),new THREE.MeshBasicMaterial({color:'#c2e4d7',transparent:true,opacity:.10}),[0,2.15,.18],[Math.PI/2,0,0]);wake.scale.y=1.5;foam.push(wake);
  }
  const birds=new THREE.Group();root.add(birds);
  for(let i=0;i<5;i++){
    const bird=new THREE.Group();bird.position.set(-3.0+i*1.25,4.2+Math.sin(i)*.35,-1.3);birds.add(bird);
    for(const side of [-1,1])box(bird,[.32,.02,.09],'#e7e9dc',[side*.16,0,0],[0,0,side*.23]);
  }
  w.update=(time,delta,state)=>{
    const wind=state.active?1:.25;
    waterMaterial.uniforms.uTime.value=time;waterMaterial.uniforms.uWind.value=wind;
    ship.rotation.z=Math.sin(time*(state.active?.85:.45))*(state.active?.045:.018);
    ship.position.y=2.05+Math.sin(time*.7)*.06;
    const p=sailGeometry.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=original[i*3],y=original[i*3+1];
      p.setZ(i,Math.cos(x/2.78*Math.PI)*(.30+wind*.10)+Math.sin(y*2+x+time*(1+wind))*.027*wind);
    }
    p.needsUpdate=true;sailGeometry.computeVertexNormals();
    flag.rotation.y=Math.sin(time*2)*.10;
    birds.position.x=Math.sin(time*.10)*.7;birds.position.y=Math.sin(time*.23)*.13;
    foam.forEach((wake,i)=>{wake.material.opacity=.045+(Math.sin(time*.65-i*.45)+1)*.035;});
  };
  return w;
}

function buildLinux() {
  const w=world(),root=w.model;root.rotation.y=-.13;
  const bodyMat=material('#142f34',.65,.43);
  mesh(root,new THREE.IcosahedronGeometry(2.63,3),bodyMat);
  const circuitry=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.65,2)),new THREE.LineBasicMaterial({color:'#68bba8',transparent:true,opacity:.29}));root.add(circuitry);
  const orbit=new THREE.Group();orbit.rotation.set(.88,.16,-.2);root.add(orbit);
  mesh(orbit,torusGeometry(3.53,.11,120),material('#376968',.8,.3));
  ring(orbit,3.74,'#92e2c4',[0,0,0],[0,0,0],.017);
  ring(orbit,3.43,'#76b8b4',[0,0,0],[0,0,0],.012);
  const lights=new THREE.InstancedMesh(boxGeometry(),emissive('#7cdac0',.8),72);
  for(let i=0;i<72;i++){
    const a=i/72*TAU;
    lights.setMatrixAt(i,new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a)*3.59,Math.sin(a)*3.59,.12),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,a)),new THREE.Vector3(.035,.10,.026)));
  }
  orbit.add(lights);
  const screenFrame=new THREE.Group();screenFrame.position.set(.05,.40,2.78);screenFrame.rotation.y=-.07;root.add(screenFrame);
  box(screenFrame,[3.93,2.68,.14],material('#263f46',.83,.29),[0,0,0]);
  box(screenFrame,[3.73,2.49,.025],material('#07181d',.3,.3),[0,0,.082]);
  const memories=[{name:'Kubuntu',desktop:'KDE Plasma',color:'#93bdec',prompt:'a first step into Linux'},{name:'Arch Linux',desktop:'Hyprland / Celestia',color:'#b4ade7',prompt:'every detail, my own'},{name:'Fedora',desktop:'KDE Plasma',color:'#82dec6',prompt:'this feels like home'}];
  const screenCanvas=document.createElement('canvas');screenCanvas.width=1024;screenCanvas.height=640;const ctx=screenCanvas.getContext('2d');
  const screenTexture=new THREE.CanvasTexture(screenCanvas);screenTexture.colorSpace=THREE.SRGBColorSpace;
  function redraw(index){
    const memory=memories[index];
    const gradient=ctx.createLinearGradient(0,0,1024,640);gradient.addColorStop(0,'#15363c');gradient.addColorStop(1,'#061b2b');ctx.fillStyle=gradient;ctx.fillRect(0,0,1024,640);
    ctx.strokeStyle=memory.color+'30';ctx.lineWidth=2;
    for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(550+i*38,0);ctx.bezierCurveTo(250+i*60,280,1000-i*25,380,650+i*55,640);ctx.stroke();}
    ctx.fillStyle='#0b1924d9';ctx.fillRect(58,69,710,459);ctx.strokeStyle='#75c4ad50';ctx.strokeRect(58,69,710,459);
    for(let i=0;i<3;i++){ctx.fillStyle=['#bc7767','#cbb777','#6dbe9c'][i];ctx.beginPath();ctx.arc(85+i*25,92,6,0,TAU);ctx.fill();}
    ctx.font='22px monospace';ctx.fillStyle='#9db9bc';ctx.fillText('bharath@'+memory.name.toLowerCase().replace(' linux',''),90,153);
    ctx.font='bold 56px monospace';ctx.fillStyle=memory.color;ctx.fillText(memory.name,90,240);
    ctx.font='25px monospace';ctx.fillStyle='#d4e5dc';ctx.fillText(memory.desktop,93,291);
    ctx.fillStyle='#75989b';ctx.font='19px monospace';ctx.fillText('> '+memory.prompt,93,368);ctx.fillText('> make it mine_',93,416);
    ctx.fillStyle=memory.color;ctx.fillRect(0,591,1024,49);ctx.fillStyle='#102b35';ctx.font='19px monospace';ctx.fillText('MY MACHINE. MY RULES.',37,623);
    screenTexture.needsUpdate=true;
  }
  redraw(2);
  mesh(screenFrame,new THREE.PlaneGeometry(3.65,2.28),new THREE.MeshBasicMaterial({map:screenTexture}),[0,0,.103]);
  const badge=new THREE.Group();badge.position.set(2.36,1.78,1.04);root.add(badge);
  mesh(badge,cylinderGeometry(.53,.53,.11,48),material('#29454e',.6,.32),[0,0,0],[Math.PI/2,0,0]);
  const logo=new THREE.TextureLoader().load('assets/fedora.svg');logo.colorSpace=THREE.SRGBColorSpace;
  mesh(badge,new THREE.PlaneGeometry(.70,.70),new THREE.MeshBasicMaterial({map:logo,transparent:true}),[0,0,.075]);
  const server=new THREE.Group();server.position.set(-2.73,-1.48,.55);server.rotation.set(.1,.23,-.14);root.add(server);
  for(let i=0;i<3;i++){
    box(server,[1.24,.30,.64],material('#243f49',.6,.4),[0,i*.37,0]);
    for(let j=0;j<4;j++)box(server,[.035,.07,.02],emissive(j===0?'#adcf84':'#609f9a',.7),[-.4+j*.12,i*.37,.333]);
    box(server,[.43,.07,.02],'#123039',[.30,i*.37,.332]);
  }
  label(root,'OPEN BY CHOICE',1.80,.28,[.20,-2.20,1.75],'#b5ded0');
  glow(root,'#4ba999',6.5,[0,0,-1],.16);
  let lastState=2;
  w.update=(time,delta,state)=>{
    const selection=(2+(state.count||0))%3;
    if(selection!==lastState){redraw(selection);lastState=selection;}
    orbit.rotation.z=-.20+Math.sin(time*.07)*.11;badge.position.y=1.78+Math.sin(time*.50)*.045;
  };
  return w;
}

function spriteLabel(parent,text,position,color){
  const texture=canvasTexture(512,128,(ctx,w)=>{ctx.fillStyle=color;ctx.font='30px monospace';ctx.textAlign='center';ctx.fillText(text,w/2,75);});
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));sprite.position.set(...position);sprite.scale.set(1.32,.33,1);parent.add(sprite);return sprite;
}

function buildConnections(){
  const w=world(),root=w.model;root.rotation.z=-.08;
  ball(root,2.66,new THREE.MeshStandardMaterial({color:'#3c2d58',metalness:.2,roughness:.85,transparent:true,opacity:.35,depthWrite:false}),[0,0,0]);
  const cage=new THREE.IcosahedronGeometry(2.84,2),edges=new THREE.LineSegments(new THREE.EdgesGeometry(cage),new THREE.LineBasicMaterial({color:'#b79bc9',transparent:true,opacity:.22}));root.add(edges);
  const unique=new Map(),coordinates=cage.attributes.position;
  for(let i=0;i<coordinates.count;i++){const x=coordinates.getX(i),y=coordinates.getY(i),z=coordinates.getZ(i);unique.set([x.toFixed(3),y.toFixed(3),z.toFixed(3)].join(','),[x,y,z]);}
  const nodes=new THREE.InstancedMesh(sphereGeometry(8),emissive('#ddbfea',.75),unique.size);
  [...unique.values()].forEach((p,i)=>nodes.setMatrixAt(i,new THREE.Matrix4().compose(new THREE.Vector3(...p),new THREE.Quaternion(),new THREE.Vector3(.022,.022,.022))));root.add(nodes);
  const centerGlow=glow(root,'#c4a4ef',5.9,[0,0,0],.54);
  ball(root,.44,emissive('#efcff5',1),[0,0,0]);
  const positions=[[-3.23,1.20,.72],[2.60,2.29,-.2],[3.41,-.92,.47],[-1.51,-3.13,.57],[.03,3.67,.5]];
  const names=['KDE','RECURSE','TOOLS','MY PEOPLE','IDEAS'];
  const colors=['#b6d7f1','#e4b9e1','#cbdcae','#e3bb9b','#b8b2ef'];
  const signals=[];
  positions.forEach((p,i)=>{
    const satellite=new THREE.Group();satellite.position.set(...p);root.add(satellite);
    ball(satellite,.125,emissive(colors[i],1),[0,0,0]);const halo=glow(satellite,colors[i],1.03,[0,0,0],.70);
    ring(satellite,.31,colors[i],[0,0,0],[0,0,0],.008);
    spriteLabel(satellite,names[i],[0,-.54,0],colors[i]);
    const endpoint=new THREE.Vector3(...p),mid=endpoint.clone().multiplyScalar(.58);mid.z+=1.25;
    const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(),mid,endpoint);
    const path=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(42)),new THREE.LineBasicMaterial({color:colors[i],transparent:true,opacity:.32}));root.add(path);
    const pulse=ball(root,.047,emissive(colors[i],1),[0,0,0]);signals.push({satellite,halo,path,pulse,curve});
  });
  const orbit=ring(root,4.18,'#b09cb8',[0,0,-.2],[.6,.16,.15],.006);
  let amount=0;
  w.update=(time,delta,state)=>{
    amount=THREE.MathUtils.damp(amount,state.active?1:0,3,delta);
    edges.material.opacity=.16+amount*.15;centerGlow.material.opacity=.40+amount*.20;
    signals.forEach((signal,i)=>{
      signal.path.material.opacity=.22+amount*.52;signal.pulse.visible=amount>.1;
      signal.pulse.position.copy(signal.curve.getPoint((time*.18+i*.18)%1));
      signal.halo.scale.setScalar(.96+Math.sin(time*.65+i)*.05+amount*.22);
    });
    orbit.rotation.z=.15+Math.sin(time*.06)*.1;
  };
  return w;
}

function buildBeyond(){
  const w=world(),root=w.model;root.position.y=.15;
  const sunMaterial=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0}},
    vertexShader:`varying vec3 vNormal;varying vec3 vPosition;void main(){vNormal=normalMatrix*normal;vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float uTime;varying vec3 vNormal;varying vec3 vPosition;void main(){vec3 n=normalize(vNormal);float edge=pow(1.-abs(n.z),2.);float bands=sin(vPosition.y*24.+sin(vPosition.x*13.+uTime*.3)*2.);vec3 c=mix(vec3(.97,.70,.37),vec3(1.,.94,.76),1.-edge);c+=bands*.023;gl_FragColor=vec4(c,1.);
    #include <colorspace_fragment>
    }`
  });
  mesh(root,sphereGeometry(64),sunMaterial,[0,0,0],[0,0,0],[1.51,1.51,1.51]);
  glow(root,'#f2bb74',9.8,[0,0,-.1],.4);glow(root,'#fae5b0',4.8,[0,0,.9],.15);
  const miniWorlds=[],colors=['#9ec479','#e6cca0','#8ed5ea','#84cdb7','#d4b3e9'];
  for(let i=0;i<5;i++){
    const orbit=new THREE.Group();orbit.rotation.set(.30+i*.065,.08,.18);root.add(orbit);
    const radius=3.03+i*.22;ring(orbit,radius,colors[i],[0,0,0],[0,0,0],.006);
    const mini=new THREE.Group();orbit.add(mini);
    if(i===0){
      box(mini,[.68,.51,.65],'#795c45',[0,0,0]);box(mini,[.7,.09,.67],'#87ae59',[0,.30,0]);box(mini,[.18,.27,.20],'#beaa77',[-.1,.48,0]);box(mini,[.26,.13,.28],'#a9764e',[-.1,.65,0]);
    }else if(i===1){
      ball(mini,.46,'#367987',[0,0,0],.1,.4);box(mini,[.03,.69,.03],'#c8ab7b',[0,.44,0]);mesh(mini,new THREE.PlaneGeometry(.40,.39),material('#e4d9ba'),[.16,.52,.03]);
    }else if(i===2){
      mesh(mini,torusGeometry(.42,.11,40),material('#a05843',.75,.3));mesh(mini,new THREE.CircleGeometry(.30,36),emissive('#adeaf3',.9),[0,0,.05]);
    }else if(i===3){
      ball(mini,.37,'#30605d',[0,0,0],.4,.4);ring(mini,.59,'#91d3bd',[0,0,0],[.75,.1,0],.023);
    }else{
      mesh(mini,new THREE.IcosahedronGeometry(.46,1),new THREE.MeshBasicMaterial({color:'#d1b7e9',wireframe:true,transparent:true,opacity:.65}));glow(mini,'#d5b2ed',.9,[0,0,0],.5);
    }
    glow(mini,colors[i],1.25,[0,0,-.04],.25);miniWorlds.push({mini,radius,angle:i/5*TAU+.2});
  }
  const dustPositions=[],random=randomSource(88);
  for(let i=0;i<400;i++){const a=random()*TAU,r=2.15+random()*2.5;dustPositions.push(Math.cos(a)*r,Math.sin(a)*r,(random()-.5)*.8);}
  const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dustPositions,3));
  const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:'#e8d1a9',size:.023,transparent:true,opacity:.47,depthWrite:false}));dust.rotation.x=.3;root.add(dust);
  w.update=(time)=>{
    sunMaterial.uniforms.uTime.value=time;
    miniWorlds.forEach(({mini,radius,angle},i)=>{const a=angle+time*(.014+i*.001);mini.position.set(Math.cos(a)*radius,Math.sin(a)*radius,Math.sin(a)*.35);mini.rotation.y=Math.sin(time*.09+i)*.12;});
    dust.rotation.z=time*.006;
  };
  return w;
}

export async function createWorlds(){
  return [buildBlocks(),buildVoyage(),await buildIronMan(),buildLinux(),buildConnections(),buildBeyond()];
}

export function createEnvironment(renderer){
  const room=new THREE.Scene();
  const walls=new THREE.Mesh(new THREE.BoxGeometry(20,14,20),new THREE.MeshBasicMaterial({color:'#7c8d99',side:THREE.BackSide}));room.add(walls);
  mesh(room,new THREE.PlaneGeometry(7,10),new THREE.MeshBasicMaterial({color:new THREE.Color(3.4,3.3,3.0),side:THREE.DoubleSide}),[-8,3,1],[0,Math.PI/2,0]);
  mesh(room,new THREE.PlaneGeometry(4,10),new THREE.MeshBasicMaterial({color:new THREE.Color(1.5,2.0,2.6),side:THREE.DoubleSide}),[8,1,1],[0,-Math.PI/2,0]);
  mesh(room,new THREE.PlaneGeometry(9,5),new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,2.3,2.5),side:THREE.DoubleSide}),[0,6,0],[-Math.PI/2,0,0]);
  const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(room,.04,.1,60).texture;
  pmrem.dispose();room.traverse(item=>{item.geometry?.dispose();if(item.material)item.material.dispose();});
  return environment;
}
