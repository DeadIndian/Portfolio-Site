import * as THREE from 'three';

// Original armor study. Every shell is a rigid part with its own release path;
// the articulated chassis stays together when the armor comes off.
export function buildIronMan() {
  const group=new THREE.Group(),model=new THREE.Group();group.add(model);
  const chassis=new THREE.Group();model.add(chassis);
  const parts=[];
  const paint=new THREE.MeshPhysicalMaterial({color:'#a71920',metalness:.78,roughness:.29,clearcoat:1,clearcoatRoughness:.2});
  const wine=new THREE.MeshStandardMaterial({color:'#5b1018',metalness:.8,roughness:.34});
  const gold=new THREE.MeshStandardMaterial({color:'#c59643',metalness:.82,roughness:.3});
  const graphite=new THREE.MeshStandardMaterial({color:'#202631',metalness:.8,roughness:.38});
  const titanium=new THREE.MeshStandardMaterial({color:'#7c8995',metalness:.9,roughness:.3});
  const rubber=new THREE.MeshStandardMaterial({color:'#080e16',metalness:.2,roughness:.65});
  const light=new THREE.MeshBasicMaterial({color:'#ddfcff',toneMapped:false});
  const cyan=new THREE.MeshBasicMaterial({color:'#52d5ff',toneMapped:false});
  const black=new THREE.MeshBasicMaterial({color:'#070d16'});
  const sphere=new THREE.SphereGeometry(1,20,12),cylinder=new THREE.CylinderGeometry(1,1,1,20);

  function mesh(parent,geometry,material,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]) {
    const item=new THREE.Mesh(geometry,material);item.position.set(...position);item.rotation.set(...rotation);item.scale.set(...scale);parent.add(item);return item;
  }
  function ellipsoid(parent,position,scale,material) { return mesh(parent,sphere,material,position,[0,0,0],scale); }
  function rod(parent,from,to,radius,material) {
    const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),direction=b.clone().sub(a);
    const item=mesh(parent,cylinder,material,a.add(b).multiplyScalar(.5).toArray(),[0,0,0],[radius,direction.length(),radius]);
    item.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());return item;
  }
  function ring(parent,radius,tube,material,position,rotation=[0,0,0]) { return mesh(parent,new THREE.TorusGeometry(radius,tube,8,40),material,position,rotation); }
  function disc(parent,radius,material,position,rotation=[0,0,0]) { return mesh(parent,new THREE.CircleGeometry(radius,40),material,position,rotation); }
  // Shaped cross-sections make the shells tapered and curved, with broad metal
  // highlights. Front-to-back depth is independent of their shoulder/limb width.
  function shell(parent,sections,material,position=[0,0,0],rotation=[0,0,0],segments=16) {
    const vertices=[],indices=[];
    for(const [y,rx,rz,z=0] of sections)for(let n=0;n<segments;n++){
      const angle=n/segments*Math.PI*2;
      vertices.push(Math.sin(angle)*rx,y,Math.cos(angle)*rz+z);
    }
    for(let row=0;row<sections.length-1;row++)for(let n=0;n<segments;n++){
      const a=row*segments+n,b=row*segments+(n+1)%segments,c=b+segments,d=a+segments;
      indices.push(a,b,d,b,c,d);
    }
    const last=(sections.length-1)*segments;
    for(let n=1;n<segments-1;n++)indices.push(0,n+1,n,last,last+n,last+n+1);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    return mesh(parent,geometry,material,position,rotation);
  }
  function plate(parent,outline,depth,material,position=[0,0,0],bevel=.045,rotation=[0,0,0],holes=[]) {
    const shape=new THREE.Shape();outline.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
    for(const points of holes){const hole=new THREE.Path();points.forEach(([x,y],i)=>i?hole.lineTo(x,y):hole.moveTo(x,y));hole.closePath();shape.holes.push(hole);}
    const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,steps:1,curveSegments:8});
    return mesh(parent,geometry,material,position,rotation);
  }
  function armor(name,position,travel,turn=[0,0,0],delay=0,rotation=[0,0,0]) {
    const item=new THREE.Group();item.name=name;item.position.set(...position);item.rotation.set(...rotation);model.add(item);
    parts.push({item,home:item.position.clone(),away:new THREE.Vector3(...travel),rest:item.quaternion.clone(),open:new THREE.Quaternion().setFromEuler(new THREE.Euler(rotation[0]+turn[0],rotation[1]+turn[1],rotation[2]+turn[2])),delay});return item;
  }
  function power(parent,position,radius) {
    ring(parent,radius+.055,.035,titanium,position);
    ring(parent,radius+.016,.025,cyan,[position[0],position[1],position[2]+.012]);
    disc(parent,radius,light,[position[0],position[1],position[2]+.018]);
    ring(parent,radius*.69,.012,cyan,[position[0],position[1],position[2]+.022]);
  }
  const mirror=(points,side)=>points.map(([x,y])=>[x*side,y]);

  // The dark structural suit, neck bearing, spine, and chest power unit.
  shell(chassis,[[.64,.53,.27],[1.1,.63,.32],[1.68,.89,.40],[2.25,.93,.38],[2.49,.59,.28]],graphite);
  rod(chassis,[0,.13,-.16],[0,2.55,-.16],.16,titanium);
  rod(chassis,[0,2.38,0],[0,2.78,0],.23,graphite);
  for(let i=0;i<4;i++)ring(chassis,.235,.025,titanium,[0,2.46+i*.075,0],[Math.PI/2,0,0]);
  for(const side of [-1,1]){
    rod(chassis,[side*.18,2.35,0],[side*1.16,2.12,0],.13,titanium);
    for(let i=0;i<5;i++)rod(chassis,[side*.25,1.23+i*.19,.37],[side*(.56+i*.045),1.31+i*.19,.30],.045,titanium);
    rod(chassis,[side*.42,.52,.24],[side*.65,1.44,.32],.065,gold);
    rod(chassis,[side*.39,.63,-.28],[side*.64,2.19,-.35],.04,titanium);
  }
  for(let i=0;i<5;i++)shell(chassis,[[.08,.42,.25],[.16,.48,.28],[.20,.44,.26]],i%2?rubber:titanium,[0,.17+i*.16,0]);
  shell(chassis,[[-.50,.48,.27],[-.31,.67,.34],[.04,.60,.30],[.23,.46,.27]],graphite);
  ellipsoid(chassis,[0,3.12,-.02],[.33,.46,.29],graphite);
  for(const side of [-1,1])disc(chassis,.068,cyan,[side*.145,3.18,.26]);
  power(chassis,[0,1.97,.50],.255);
  for(let n=0;n<8;n++){
    const a=n/8*Math.PI*2;rod(chassis,[Math.cos(a)*.32,1.97+Math.sin(a)*.32,.50],[Math.cos(a)*.37,1.97+Math.sin(a)*.37,.47],.019,gold);
  }

  const helmet=armor('Helmet shell',[0,3.13,0],[0,1.04,-.50],[-.1,.12,0],.05);
  shell(helmet,[[-.57,.24,.27],[-.43,.36,.37],[-.1,.46,.405],[.26,.46,.405],[.47,.36,.35],[.61,.18,.22],[.65,.015,.10]],paint);
  for(const side of [-1,1]){
    ring(helmet,.14,.055,gold,[side*.445,-.04,0],[0,Math.PI/2,0]);
    disc(helmet,.095,graphite,[side*.485,-.04,0],[0,side*Math.PI/2,0]);
    plate(helmet,mirror([[.32,-.2],[.43,-.11],[.38,-.38],[.22,-.52]],side),.08,wine,[0,0,.27],.025);
  }
  const mask=armor('Gold faceplate',[0,3.13,.389],[1.10,1.14,1.05],[-.16,-.25,-.12],0);
  const face=[[-.24,.53],[-.375,.39],[-.386,.1],[-.28,-.08],[-.285,-.28],[-.16,-.47],[0,-.51],[.16,-.47],[.285,-.28],[.28,-.08],[.386,.1],[.375,.39],[.24,.53]];
  const eye=[[-.325,.135],[-.071,.074],[-.083,-.002],[-.304,.046]];
  plate(mask,face,.07,gold,[0,0,0],.018,[0,0,0],[eye,mirror(eye,-1)]);
  for(const side of [-1,1]){
    plate(mask,mirror(eye,side),.008,light,[0,0,.045],0);
    plate(mask,mirror([[.08,-.13],[.105,-.17],[.10,-.34],[.06,-.355]],side),.004,wine,[0,0,.098],.004);
    plate(mask,mirror([[.265,-.18],[.225,-.27],[.2,-.30],[.235,-.19]],side),.004,graphite,[0,0,.098],.002);
  }
  plate(mask,[[-.15,-.347],[-.105,-.326],[.105,-.326],[.15,-.347],[.11,-.36],[-.11,-.36]],.005,black,[0,0,.102],0);
  plate(mask,[[-.2,.52],[.2,.52],[.26,.44],[-.26,.44]],.012,gold,[0,0,.093],.01);

  // Paired chest plates leave a real opening around the small arc reactor.
  for(const side of [-1,1]){
    const chest=armor(`${side<0?'Left':'Right'} breastplate`,[0,1.96,.38],[side*.87,.26,1.0],[.06,side*.20,side*-.12],.11);
    const shape=[[.12,.46],[.53,.53],[.98,.34],[1.01,.01],[.79,-.35],[.42,-.44],[.17,-.32],[.31,-.15],[.36,.02],[.29,.23],[.13,.31]];
    plate(chest,mirror(shape,side),.17,paint,[0,0,0],.065);
    plate(chest,mirror([[.45,-.34],[.74,-.27],[.93,-.01],[.87,-.25],[.76,-.39],[.44,-.48]],side),.021,gold,[0,0,.105],.015);
    plate(chest,mirror([[.22,.47],[.52,.50],[.83,.37],[.52,.39]],side),.018,titanium,[0,0,.24],.009);
    plate(chest,mirror([[.79,.2],[.92,.10],[.91,-.02],[.77,.08]],side),.014,wine,[0,0,.24],.008);
    const hip=armor(`${side<0?'Left':'Right'} hip armor`,[side*.49,-.13,.08],[side*.65,-.06,.54],[0,side*.24,side*-.15],.19);
    plate(hip,mirror([[-.2,.27],[.15,.23],[.29,-.11],[.12,-.40],[-.15,-.28]],side),.27,paint,[0,0,0],.065);
    plate(hip,mirror([[-.10,.15],[.13,.09],[.17,-.10],[.06,-.17]],side),.028,gold,[0,0,.34],.02);
  }
  const back=armor('Back armor',[0,1.68,-.38],[0,.16,-1.05],[.10,0,0],.16);
  shell(back,[[-.57,.54,.13],[-.1,.81,.20],[.48,.92,.17],[.76,.57,.11]],wine);
  for(const side of [-1,1])plate(back,mirror([[.1,.56],[.46,.65],[.76,.37],[.6,-.3],[.22,-.36]],side),.065,paint,[0,0,-.20],.045,[0,Math.PI,0]);
  for(let i=0;i<3;i++){
    const ab=armor(`Abdominal plate ${i+1}`,[0,1.28-i*.29,.35],[(i%2?-.58:.58),.06-i*.09,.85+i*.10],[.07,0,(i%2?1:-1)*.13],.18+i*.04);
    const width=.60-i*.07;
    plate(ab,[[-width,.15],[0,.04],[width,.15],[width*.89,-.08],[0,-.2],[-width*.89,-.08]],.12,paint,[0,0,0],.04);
    plate(ab,[[-width*.72,-.07],[0,-.14],[width*.72,-.07],[0,-.18]],.008,gold,[0,0,.125],.008);
  }
  const pelvis=armor('Pelvic shield',[0,-.15,.34],[0,-.33,.95],[.12,0,0],.28);
  plate(pelvis,[[-.29,.29],[.29,.29],[.32,.06],[.15,-.33],[-.15,-.33],[-.32,.06]],.14,paint,[0,0,0],.055);
  plate(pelvis,[[-.19,.18],[.19,.18],[.12,.03],[-.12,.03]],.025,gold,[0,0,.205],.018);

  for(const side of [-1,1]){
    const name=side<0?'Left':'Right';
    const shoulder=[side*1.19,2.13,-.02],elbow=[side*1.55,.87,.01],wrist=[side*1.77,-.40,.1];
    ellipsoid(chassis,shoulder,[.31,.33,.31],graphite);
    rod(chassis,shoulder,elbow,.18,graphite);rod(chassis,elbow,wrist,.16,graphite);
    ellipsoid(chassis,elbow,[.235,.235,.24],rubber);
    ring(chassis,.16,.043,titanium,[side*1.55,.87,.205]);
    rod(chassis,[side*1.18,1.94,.14],[side*1.43,1.03,.14],.057,titanium);
    rod(chassis,[side*1.65,.69,.12],[side*1.82,-.27,.19],.045,gold);
    for(let i=0;i<3;i++)ring(chassis,.16,.026,titanium,[side*(1.74+i*.013),-.30-i*.063,.10],[Math.PI/2,0,0]);

    const shoulderArmor=armor(`${name} shoulder`,shoulder,[side*.98,.59,.20],[.10,side*.15,-side*.34],.045,[0,0,side*.18]);
    shell(shoulderArmor,[[-.34,.39,.37],[-.13,.48,.40],[.17,.45,.38],[.36,.29,.30],[.43,.08,.15]],paint);
    shell(shoulderArmor,[[-.35,.40,.38],[-.28,.425,.39]],gold);
    plate(shoulderArmor,[[-.25,.19],[.23,.19],[.32,-.02],[.18,-.12],[-.23,-.12],[-.34,.02]],.035,wine,[0,0,.35],.025);

    const bicep=armor(`${name} upper arm`,[side*1.39,1.48,0],[side*.94,.25,.49],[.06,side*.16,-side*.14],.16,[0,0,-side*.24]);
    shell(bicep,[[-.47,.24,.235],[-.32,.27,.25],[.15,.32,.29],[.43,.26,.235]],gold);
    plate(bicep,mirror([[.15,.37],[.26,.23],[.22,-.36],[.09,-.41],[.05,.04]],side),.07,paint,[0,0,.21],.035);
    const bracer=armor(`${name} forearm`,[side*1.69,.25,.075],[side*1.05,.03,.82],[.06,side*.13,-side*.21],.21,[0,0,-side*.13]);
    shell(bracer,[[-.60,.22,.23],[-.42,.26,.275],[.10,.35,.33],[.42,.31,.29],[.53,.23,.23]],paint);
    plate(bracer,[[-.22,.37],[.22,.37],[.16,-.30],[.07,-.48],[-.10,-.45],[-.19,-.11]],.055,wine,[0,0,.29],.03);
    plate(bracer,[[-.10,.28],[.10,.28],[.09,.13],[-.09,.13]],.02,titanium,[0,0,.353],.012);
    for(let i=0;i<3;i++)plate(bracer,[[-.13,.018],[.13,.018],[.11,-.018],[-.11,-.018]],.013,graphite,[0,.0-i*.1,.39],.005);
    shell(bracer,[[-.58,.225,.24],[-.50,.24,.25]],gold);

    const palm=armor(`${name} gauntlet`,[side*1.8,-.66,.12],[side*1.10,-.29,.90],[.05,-side*.18,-side*.13],.27,[0,0,-side*.10]);
    ellipsoid(chassis,[side*1.8,-.66,.08],[.18,.25,.10],graphite);
    shell(palm,[[-.22,.20,.14],[.02,.23,.17],[.20,.19,.15]],paint);
    power(palm,[0,-.03,.17],.075);
    for(let i=0;i<4;i++){
      const x=-.155+i*.104,length=i===0||i===3?.27:.34;
      rod(palm,[x,-.20,0],[x,-.20-length,-.01],.044,graphite);
      for(let n=0;n<3;n++)shell(palm,[[-.045,.041,.045],[.025,.044,.049],[.048,.032,.04]],paint,[x,-.245-n*(length/3),.045]);
      ellipsoid(palm,[x,-.18,.11],[.044,.044,.035],gold);
    }
    rod(palm,[-side*.20,-.03,0],[-side*.31,-.25,.06],.065,paint);
    ellipsoid(palm,[-side*.31,-.27,.065],[.065,.085,.065],paint);

    const hip=[side*.50,-.38,0],knee=[side*.66,-1.93,.01],ankle=[side*.73,-3.44,.02];
    ellipsoid(chassis,hip,[.26,.28,.25],titanium);rod(chassis,hip,knee,.24,graphite);
    ellipsoid(chassis,knee,[.27,.25,.25],rubber);ring(chassis,.15,.05,titanium,[side*.66,-1.93,.245]);
    rod(chassis,knee,ankle,.17,graphite);ellipsoid(chassis,ankle,[.18,.21,.21],graphite);
    rod(chassis,[side*.76,-2.07,.15],[side*.82,-3.31,.12],.06,titanium);
    rod(chassis,[side*.46,-.60,.20],[side*.57,-1.71,.19],.065,titanium);

    const thigh=armor(`${name} thigh`,[side*.59,-1.16,0],[side*.81,-.04,.44],[.02,side*.2,-side*.1],.24,[0,0,-side*.09]);
    shell(thigh,[[-.64,.25,.25],[-.50,.29,.28],[.13,.40,.36],[.54,.36,.31],[.64,.28,.26]],gold);
    plate(thigh,mirror([[.10,.54],[.33,.46],[.34,-.15],[.19,-.52],[.10,-.51],[.20,.05]],side),.08,paint,[0,0,.25],.04);
    plate(thigh,[[-.16,.48],[.16,.48],[.21,.12],[.10,-.37],[-.10,-.37],[-.21,.12]],.04,gold,[0,0,.30],.035);
    const kneeArmor=armor(`${name} knee`,[side*.66,-1.95,.24],[side*.93,-.13,1.08],[.13,side*.12,side*.12],.30);
    plate(kneeArmor,[[-.28,.19],[-.16,.31],[.16,.31],[.28,.19],[.23,-.13],[0,-.25],[-.23,-.13]],.16,paint,[0,0,0],.045);
    plate(kneeArmor,[[-.13,.14],[.13,.14],[.17,.02],[0,-.09],[-.17,.02]],.025,gold,[0,0,.17],.02);
    const shin=armor(`${name} shin`,[side*.70,-2.77,.015],[side*1.03,-.10,.55],[.05,side*.13,side*.10],.34,[0,0,-side*.045]);
    shell(shin,[[-.66,.22,.245],[-.49,.26,.27],[.14,.35,.34],[.47,.33,.31],[.63,.27,.26]],paint);
    plate(shin,[[-.15,.48],[.15,.48],[.21,.17],[.13,-.47],[0,-.59],[-.13,-.47],[-.21,.17]],.08,paint,[0,0,.255],.045);
    for(const edge of [-1,1])plate(shin,mirror([[.18,.38],[.27,.33],[.23,-.17],[.16,-.38]],edge),.013,gold,[0,0,.39],.008);
    const boot=armor(`${name} boot`,[side*.74,-3.58,.16],[side*.82,-.46,.75],[.11,side*.08,side*.03],.39);
    shell(boot,[[-.16,.29,.54,.10],[-.08,.31,.55,.10],[.13,.28,.48,.08],[.30,.22,.31,-.05]],paint);
    shell(boot,[[-.23,.29,.55,.10],[-.16,.30,.555,.10]],rubber);
    plate(boot,[[-.22,.09],[.22,.09],[.19,-.04],[-.19,-.04]],.06,wine,[0,-.045,.60],.025);
    ellipsoid(chassis,[side*.74,-3.65,.16],[.22,.14,.42],graphite);
  }

  // Merge the rigid meshes by material inside each part. Articulation remains
  // independent while the fingers, ribs, and trim share a handful of draw calls.
  function batch(parent) {
    const batches=new Map();
    for(const child of [...parent.children]){
      if(!child.isMesh)continue;child.updateMatrix();
      const geometry=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();geometry.applyMatrix4(child.matrix);
      if(!batches.has(child.material))batches.set(child.material,[]);batches.get(child.material).push(geometry);parent.remove(child);
    }
    for(const [material,geometries] of batches){
      const merged=new THREE.BufferGeometry();
      for(const attribute of ['position','normal']){
        const length=geometries.reduce((n,g)=>n+g.attributes[attribute].array.length,0),array=new Float32Array(length);let offset=0;
        for(const geometry of geometries){array.set(geometry.attributes[attribute].array,offset);offset+=geometry.attributes[attribute].array.length;}
        merged.setAttribute(attribute,new THREE.BufferAttribute(array,3));
      }
      merged.computeBoundingSphere();mesh(parent,merged,material);geometries.forEach(geometry=>geometry.dispose());
    }
  }
  batch(chassis);parts.forEach(({item})=>batch(item));
  // Crown the face and pectoral panels so their reflections describe armor
  // surfaces. Trim and eye openings follow the same surface as their shell.
  for(const {item} of parts){
    if(item!==mask&&!item.name.endsWith('breastplate'))continue;
    for(const child of item.children){
      const vertices=child.geometry.attributes.position,normals=child.geometry.attributes.normal,normal=new THREE.Vector3();
      for(let n=0;n<vertices.count;n++){
        const x=vertices.getX(n),y=vertices.getY(n);
        const relief=item===mask?.10*(1-Math.min(1,(x/.43)**2))-.04*Math.max(0,-y-.17):.12*(1-((Math.abs(x)-.54)/.64)**2)-.07*Math.max(0,-y);
        vertices.setZ(n,vertices.getZ(n)+relief);
        const slopeX=item===mask?(Math.abs(x)<.43?-.2*x/(.43**2):0):-.24*(Math.abs(x)-.54)*Math.sign(x)/(.64**2);
        const slopeY=item===mask?(y<-.17?.04:0):(y<0?.07:0);
        normal.set(normals.getX(n)-slopeX*normals.getZ(n),normals.getY(n)-slopeY*normals.getZ(n),normals.getZ(n)).normalize();normals.setXYZ(n,normal.x,normal.y,normal.z);
      }
      vertices.needsUpdate=true;normals.needsUpdate=true;child.geometry.computeBoundingSphere();
    }
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
    model.rotation.set(-.025,-.16-world.expansion*.16,0);
  }};
  world.update(0,1,{active:false});return world;
}
