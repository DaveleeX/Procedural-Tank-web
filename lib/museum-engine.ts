import * as THREE from 'three';
import { createMuseumLighting } from './museum-lighting';
import { bindMuseumMaterials } from './museum-materials';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createVisitors } from './museum-visitors';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { museumAsset } from './museum-assets';
export type MuseumController={view:(index:number)=>void;tour:(running:boolean)=>void;walk:()=>void;step:(key:string)=>void;night:(enabled:boolean)=>void;dispose:()=>void};
type CameraRecord={name:string;type:string;position:number[];quaternion:number[];orthoScale:number;lens:number;sensorWidth:number};
type RoutePoint={frame:number;eye:number[];look_at:number[]};
type Callbacks={progress:(n:number)=>void;ready:()=>void;error:(message:string)=>void;selection:(n:number)=>void;mode:(mode:'orbit'|'walk'|'tour')=>void};
const axis=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
const v=(a:number[])=>new THREE.Vector3(a[0],a[2],-a[1]);
const q=(a:number[])=>new THREE.Quaternion(a[1],a[2],a[3],a[0]).premultiply(axis);
export async function createMuseum(container:HTMLElement,cb:Callbacks,signal:AbortSignal):Promise<MuseumController>{
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.setClearColor('#667356');container.appendChild(renderer.domElement);
 renderer.domElement.setAttribute('aria-label','可交互的微缩坦克博物馆，拖动旋转，滚轮缩放');renderer.domElement.tabIndex=0;
 const scene=new THREE.Scene();const visitors=createVisitors(scene);const lighting=createMuseumLighting(scene,renderer);let surfaces:Awaited<ReturnType<typeof bindMuseumMaterials>>|undefined;
 const overview=new THREE.OrthographicCamera(-32.5,32.5,24.375,-24.375,1,220);
 const perspective=new THREE.PerspectiveCamera(52,1,.12,220);
 let camera:THREE.OrthographicCamera|THREE.PerspectiveCamera=overview;const controls:OrbitControls<THREE.OrthographicCamera|THREE.PerspectiveCamera>=new OrbitControls(overview,renderer.domElement);
 controls.enableDamping=true;controls.dampingFactor=.09;controls.maxPolarAngle=Math.PI*.485;controls.minZoom=.65;controls.maxZoom=6;
 let mode:'orbit'|'walk'|'tour'='orbit',lastMode:'orbit'|'walk'='orbit',tourTime=0,lastFrame=0,raf=0,lastNow=performance.now(),disposed=false;
 let records:CameraRecord[]=[],route:RoutePoint[]=[];let model:THREE.Group|undefined;
 const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:Math.min(2,renderer.capabilities.maxSamples)});
 const composer=new EffectComposer(renderer,target);const renderPass=new RenderPass(scene,camera);const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.06,.45,1.1);const outputPass=new OutputPass();composer.addPass(renderPass);composer.addPass(bloom);composer.addPass(outputPass);
 const keys=new Set<string>(),pointer={down:false,x:0,y:0,sx:0,sy:0};const raycaster=new THREE.Raycaster();
 const setMode=(m:typeof mode)=>{mode=m;controls.enabled=m==='orbit';cb.mode(m)};
 const resize=()=>{const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;const aspect=w/h;const vh=48.75*Math.max(1,(4/3)/aspect);overview.left=-vh*aspect/2;overview.right=vh*aspect/2;overview.top=vh/2;overview.bottom=-vh/2;overview.updateProjectionMatrix();perspective.aspect=aspect;perspective.updateProjectionMatrix();renderer.setSize(w,h,false);composer.setSize(w,h)};
 const ro=new ResizeObserver(resize);ro.observe(container);resize();
 const aim=(eye:THREE.Vector3,target:THREE.Vector3)=>{perspective.position.copy(eye);perspective.lookAt(target);controls.target.copy(target)};
 const installCamera=(record:CameraRecord,target:THREE.Vector3)=>{
  camera=record.type==='ORTHO'?overview:perspective;camera.position.copy(v(record.position));camera.quaternion.copy(q(record.quaternion));
  if(camera===perspective){perspective.fov=2*Math.atan(record.sensorWidth/(2*record.lens)/(container.clientWidth/container.clientHeight))*180/Math.PI;perspective.fov=THREE.MathUtils.clamp(perspective.fov,40,78);perspective.updateProjectionMatrix()}
  else{overview.zoom=1;overview.updateProjectionMatrix()}
  controls.object=camera;controls.maxPolarAngle=camera===overview?Math.PI*.485:Math.PI*.96;controls.target.copy(target);controls.update();
 };
 const galleryTargets=[[-11,-8,2.2],[11,-8,2.05],[-11,7,2.05],[11,7,2.05],[0,23,2.05]];
 const view=(index:number)=>{if(!records.length)return;void surfaces?.focus(index);tourTime=0;keys.clear();setMode('orbit');lastMode='orbit';
  if(index<0)installCamera(records[0],v([0,5,0]));else installCamera(records[index+3],v(galleryTargets[index]));cb.selection(index);
 };
 const walk=()=>{if(!records.length)return;tourTime=0;camera=perspective;installCamera(records[2],v(route[0]?.look_at||[0,5,2]));setMode('walk');lastMode='walk';cb.selection(-1);renderer.domElement.focus({preventScroll:true})};
 const tour=(running:boolean)=>{if(!route.length)return;if(!running){setMode(lastMode);return}lastMode=mode==='walk'?'walk':'orbit';camera=perspective;controls.object=perspective;perspective.fov=52;perspective.updateProjectionMatrix();setMode('tour');};
 const move=(key:string,amount:number)=>{if(mode!=='walk')return;const forward=new THREE.Vector3();perspective.getWorldDirection(forward);forward.y=0;forward.normalize();const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0));const delta=new THREE.Vector3();if(key==='w')delta.copy(forward);if(key==='s')delta.copy(forward).negate();if(key==='a')delta.copy(right).negate();if(key==='d')delta.copy(right);perspective.position.addScaledVector(delta,amount);perspective.position.x=THREE.MathUtils.clamp(perspective.position.x,-3.95,3.95);perspective.position.z=THREE.MathUtils.clamp(perspective.position.z,-16.4,21);perspective.position.y=1.7;controls.target.copy(perspective.position).add(forward.multiplyScalar(8));};
 const down=(e:PointerEvent)=>{pointer.down=true;pointer.x=pointer.sx=e.clientX;pointer.y=pointer.sy=e.clientY;if(mode==='tour'){setMode('orbit');lastMode='orbit'}if(mode==='walk')renderer.domElement.setPointerCapture(e.pointerId)};
 const pointerMove=(e:PointerEvent)=>{if(!pointer.down||mode!=='walk')return;const eu=new THREE.Euler().setFromQuaternion(perspective.quaternion,'YXZ');eu.y-=(e.clientX-pointer.x)*.004;eu.x=THREE.MathUtils.clamp(eu.x-(e.clientY-pointer.y)*.004,-1.25,1.25);perspective.quaternion.setFromEuler(eu);pointer.x=e.clientX;pointer.y=e.clientY;};
 const up=(e:PointerEvent)=>{if(pointer.down&&mode==='orbit'&&Math.hypot(e.clientX-pointer.sx,e.clientY-pointer.sy)<5&&model){const r=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hits=raycaster.intersectObject(model,true);if(hits.length){const name=hits[0].object.name;const match=name.match(/^(0[1-5])_(?:tank|detail|glow)/);if(match)view(Number(match[1])-1)}}pointer.down=false};
 const keydown=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest('button,input,textarea,select'))return;if(mode==='walk'&&['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();keys.add(({ArrowUp:'w',ArrowDown:'s',ArrowLeft:'a',ArrowRight:'d'} as Record<string,string>)[e.key]||e.key.toLowerCase())}if(e.key==='Escape'&&mode==='walk'){setMode('orbit');lastMode='orbit'}};
 const keyup=(e:KeyboardEvent)=>keys.delete(({ArrowUp:'w',ArrowDown:'s',ArrowLeft:'a',ArrowRight:'d'} as Record<string,string>)[e.key]||e.key.toLowerCase());
 const blur=()=>{keys.clear();pointer.down=false};
 renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',pointerMove);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',blur);window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);
 const releaseModel=()=>{model?.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){if('map'in m)(m.map as THREE.Texture|null)?.dispose();m.dispose()}}})};
 const dispose=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(raf);ro.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',pointerMove);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',blur);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);surfaces?.dispose();releaseModel();visitors.dispose();lighting.dispose();composer.dispose();bloom.dispose();outputPass.dispose();renderer.dispose();renderer.domElement.remove()};signal.addEventListener('abort',dispose,{once:true});
 try{
  const response=await fetch(museumAsset('/museum/cameras.json'),{signal});if(!response.ok)throw new Error('Camera data could not be loaded');const data=await response.json() as {cameras:CameraRecord[];route:RoutePoint[]};records=data.cameras;route=data.route;
  const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);model=(await loader.loadAsync(museumAsset('/museum/model-hybrid/museum.gltf'),e=>{if(e.total&&!disposed)cb.progress(Math.min(95,Math.round(e.loaded/e.total*95)))})).scene;
  if(disposed){releaseModel();return {view,tour,walk,step:key=>move(key,.7),night:lighting.setNight,dispose}}
  model.traverse(o=>{if(o instanceof THREE.Mesh){const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){if('map'in m&&m.map)(m.map as THREE.Texture).anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());m.toneMapped=true;}}});
  surfaces=await bindMuseumMaterials(model,renderer,signal);if(disposed){surfaces.dispose();releaseModel();return {view,tour,walk,step:key=>move(key,.7),night:lighting.setNight,dispose};}
  scene.add(model);lighting.registerModel(model);view(-1);cb.progress(100);cb.ready();let qualityClock=0;
  const tick=(now:number)=>{if(disposed)return;const dt=Math.min(.05,(now-lastNow)/1000);lastNow=now;
   if(!document.hidden){visitors.update(dt);const night=lighting.update(dt);if(surfaces)surfaces.mix.value=night;bloom.strength=THREE.MathUtils.lerp(.06,.65,night);
    if(mode==='tour'){
     tourTime+=dt;const f=1+tourTime*30;let n=route.findIndex(p=>p.frame>=f);if(n<0){tourTime=0;setMode('orbit');lastMode='orbit'}else{n=Math.max(1,n);const a=route[n-1],b=route[n],t=(f-a.frame)/(b.frame-a.frame);aim(v(a.eye).lerp(v(b.eye),t),v(a.look_at).lerp(v(b.look_at),t));if(Math.floor(f/30)!==lastFrame){lastFrame=Math.floor(f/30);cb.selection(f<180?-1:f<390?0:f<690?1:f<990?2:f<1290?3:4)}}
    }else if(mode==='walk'){for(const key of keys)move(key,dt*3.2)}else controls.update();renderPass.camera=camera;composer.render(dt);
    qualityClock+=dt;if(qualityClock>.7){qualityClock=0;let nearest=-1,best=Infinity;if(camera===perspective||overview.zoom>1.6){const point=camera===overview?controls.target:camera.position;galleryTargets.forEach((p,i)=>{const d=point.distanceTo(v(p));if(d<best){best=d;nearest=i;}});}void surfaces?.focus(nearest);}

   }raf=requestAnimationFrame(tick)
  };lastNow=performance.now();raf=requestAnimationFrame(tick);
 }catch(error){if(!disposed){cb.error(error instanceof Error?error.message:'3D scene unavailable');dispose()}}
 return {view,tour,walk,step:key=>move(key,.7),night:lighting.setNight,dispose};
}
