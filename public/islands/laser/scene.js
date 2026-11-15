import * as T from '../three.module.js';
import {SoftwareRenderer} from './software.js';
const $=s=>document.getElementById(s),clamp=T.MathUtils.clamp,lerp=T.MathUtils.lerp;
let renderer;try{renderer=new T.WebGLRenderer({canvas:$('scene'),antialias:true,alpha:false,powerPreference:'high-performance'});}catch{const old=$('scene'),canvas=old.cloneNode();old.replaceWith(canvas);renderer=new SoftwareRenderer(canvas);}renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const scene=new T.Scene();scene.background=new T.Color('#101a2c');scene.fog=new T.FogExp2('#101a2c',.012);const camera=new T.PerspectiveCamera(39,1,.1,220);
scene.add(new T.HemisphereLight('#bde7ff','#33305d',2.2));const sun=new T.DirectionalLight('#fff0d6',3.5);sun.position.set(-9,20,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16,near:1,far:65});sun.shadow.bias=-.0005;sun.shadow.normalBias=.025;sun.shadow.radius=4;scene.add(sun);const rim=new T.DirectionalLight('#85aaff',2.3);rim.position.set(12,7,-12);scene.add(rim);
const world=new T.Group();scene.add(world);
const mat=(c,metal=.1,rough=.55)=>new T.MeshStandardMaterial({color:c,metalness:metal,roughness:rough});const steel=mat('#33465b',.65,.5),dark=mat('#1c2c3e',.65),tilemat=mat('#53697a',.42),gold=mat('#e7b85b',.5),ink=mat('#172b3f',.3),mint=mat('#d4ff7a');
function box(w,h,d,m,x=0,y=0,z=0,parent=world){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function ball(r,m,x,y,z,parent,sx=1,sy=1,sz=1){const o=new T.Mesh(new T.SphereGeometry(r,20,14),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;parent.add(o);return o}
function cyl(r1,r2,h,m,x,y,z,parent=world){const o=new T.Mesh(new T.CylinderGeometry(r1,r2,h,16),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
const arena=new T.Group();world.add(arena);box(17,.65,21,dark,0,-.55,0,arena);box(16.7,.22,20.7,steel,0,-.15,0,arena);
for(let x=0;x<4;x++)for(let z=0;z<5;z++){box(3.94,.12,3.94,tilemat,(x-1.5)*4.08,-.015,(z-2)*4.08,arena);for(let dx of [-1.73,1.73])for(let dz of [-1.73,1.73])cyl(.045,.045,.035,gold,(x-1.5)*4.08+dx,.06,(z-2)*4.08+dz,arena);}
for(let x of [-8.3,8.3]){box(.13,.15,20.8,gold,x,.08,0,arena);for(let z=-9.8;z<10;z+=.65){const stripe=box(.27,.13,.24,ink,x,.17,z,arena);stripe.rotation.y=.5;}}
for(let z of [-10.3,10.3]){box(16.6,.15,.14,gold,0,.08,z,arena);for(let x=-8;x<8;x+=.65){let s=box(.25,.13,.25,ink,x,.17,z,arena);s.rotation.y=.5;}}
for(let x of [-8,8])for(let z of [-9.8,9.8]){box(.15,.8,1.8,gold,x,.5,z,arena);box(2,.12,.12,gold,x>0?7.15:-7.15,.9,z,arena);}
// Recessed vents, hatches, fasteners and underlit propulsion pods.
for(let z=-8;z<=8;z+=4){box(.9,.035,2.8,dark,0,.07,z,arena);for(let i=-6;i<=6;i++)box(.7,.018,.045,steel,0,.095,z+i*.19,arena);}
for(const [x,z] of [[-4,-4],[4,4]]){box(2.6,.04,2.6,gold,x,.075,z,arena);box(2.46,.05,2.46,steel,x,.1,z,arena);box(.5,.035,.12,gold,x+.8,.14,z+.9,arena);}
for(let x of [-6.4,6.4])for(let z of [-8,8]){cyl(.9,.65,1.4,dark,x,-1.25,z,arena);let o=cyl(.6,.35,.3,new T.MeshBasicMaterial({color:'#7df0f8'}),x,-2,z,arena);const glow=new T.PointLight('#65d9ff',7,5);glow.position.set(x,-2,z);arena.add(glow);}
const marker=box(2.6,.02,.16,mint,0,.1,8.3,arena);

// Merge the static platform by material to reduce draw calls on phones.
if(!renderer.isSoftware){const batches=new Map();for(const o of [...arena.children]){if(!o.isMesh)continue;o.updateMatrix();const g=o.geometry.toNonIndexed();g.applyMatrix4(o.matrix);let list=batches.get(o.material);if(!list)batches.set(o.material,list=[]);list.push(g);arena.remove(o)}for(const [material,list] of batches){const merged=new T.BufferGeometry();for(const key of ['position','normal','uv']){let size=list[0].attributes[key].itemSize,total=list.reduce((n,g)=>n+g.attributes[key].array.length,0),data=new Float32Array(total),offset=0;for(const g of list){data.set(g.attributes[key].array,offset);offset+=g.attributes[key].array.length}merged.setAttribute(key,new T.BufferAttribute(data,size))}let mesh=new T.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;arena.add(mesh);list.forEach(g=>g.dispose())}}

// Soft nebula clouds are local procedural textures, with no remote asset dependency.
const nebCanvas=document.createElement('canvas');nebCanvas.width=nebCanvas.height=128;let nc=nebCanvas.getContext('2d'),g=nc.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,.4)');g.addColorStop(.4,'rgba(255,255,255,.17)');g.addColorStop(1,'rgba(255,255,255,0)');nc.fillStyle=g;nc.fillRect(0,0,128,128);const cloudTex=new T.CanvasTexture(nebCanvas);
for(let i=0;i<22;i++){const c=new T.Sprite(new T.SpriteMaterial({map:cloudTex,color:i%2?'#4b89a2':'#ae825a',transparent:true,opacity:.3,depthWrite:false,blending:T.AdditiveBlending}));c.position.set(Math.sin(i*2.4)*32,-8+Math.sin(i)*5,-25+Math.cos(i*2.2)*21);c.scale.set(24,24,1);scene.add(c)}
const starsGeo=new T.BufferGeometry(),positions=[];let seed=21;function rng(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}for(let i=0;i<1000;i++){positions.push((rng()-.5)*160,(rng()-.35)*100,(rng()-.5)*160)}starsGeo.setAttribute('position',new T.Float32BufferAttribute(positions,3));scene.add(new T.Points(starsGeo,new T.PointsMaterial({size:.07,color:'#a0c7e0',transparent:true,opacity:.65})));
const rocks=[];for(let i=0;i<26;i++){let rock=new T.Mesh(new T.DodecahedronGeometry(.5+rng()*1.1,0),mat(i%2?'#556279':'#536075',.15,.95));let angle=i/26*Math.PI*2;rock.position.set(Math.cos(angle)*(16+rng()*13),-5-rng()*8,Math.sin(angle)*(20+rng()*13));rock.rotation.set(rng()*6,rng()*6,rng()*6);scene.add(rock);rocks.push(rock)}

export {T,renderer,scene,camera,world,mat,box,ball,cyl,dark,mint,rng};
export function updateEnvironment(t){for(const rock of rocks)rock.rotation.y+=.001}
export function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}addEventListener("resize",resize);resize();
