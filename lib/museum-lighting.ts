import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createDayNightRig(scene:THREE.Scene,onExposure:(exposure:number)=>void=()=>{}){
 const sun=new THREE.DirectionalLight(new THREE.Color(1,.88,.72),2.7);
 sun.position.set(-24.7,32,16.8);sun.target.position.set(0,0,-5);sun.castShadow=true;
 Object.assign(sun.shadow.camera,{left:-34,right:34,top:36,bottom:-36,near:1,far:110});sun.shadow.camera.updateProjectionMatrix();sun.shadow.mapSize.set(4096,4096);sun.shadow.bias=-.00008;sun.shadow.normalBias=.022;sun.shadow.radius=2;
 const sky=new THREE.HemisphereLight(0xacc8ed,0x584632,.32);
 const moon=new THREE.DirectionalLight(0x6d91e8,0);moon.position.set(20,30,-30);
 scene.add(sun,sun.target,sky,moon);
 const lamps:THREE.Light[]=[];const owned:THREE.Object3D[]=[];
 for(const x of [-19.2,19.2])for(const z of [15.5,1,-13.8,-28]){
  const lamp=new THREE.PointLight(0xffba73,0,9,2);lamp.position.set(x,2.9,z+.2);scene.add(lamp);lamps.push(lamp);
 }
 const bays=[[-11,-8,Math.PI/2],[11,-8,-Math.PI/2],[-11,7,Math.PI/2],[11,7,-Math.PI/2],[0,23,0]];
 for(const [i,[x,y,a]] of bays.entries()){
  const localX=1,localY=-2.2;
  const px=x+Math.cos(a)*localX-Math.sin(a)*localY,py=y+Math.sin(a)*localX+Math.cos(a)*localY;
  const spot=new THREE.SpotLight(i===4?0xb4d9ff:0xffdbab,0,19,Math.PI*.31,.65,2);
  spot.position.set(px,6.54,-py);spot.target.position.set(x,1,-y);spot.castShadow=false;
  spot.shadow.mapSize.set(1024,1024);spot.shadow.bias=-.00012;spot.shadow.normalBias=.028;spot.shadow.camera.near=.4;spot.shadow.camera.far=22;
  scene.add(spot,spot.target);lamps.push(spot);owned.push(spot.target);
 }
 const rim=new THREE.PointLight(0x4da5ff,0,12,2);rim.position.set(0,4,-27);scene.add(rim);lamps.push(rim);
 let night=0,target=0;const emissive:THREE.MeshStandardMaterial[]=[];
 const daySky=new THREE.Color('#91a4b0'),nightSky=new THREE.Color('#050a19');scene.background=daySky.clone();
 function registerModel(model:THREE.Object3D){
  const seen=new Set<THREE.Material>();
  model.traverse(o=>{if(!(o instanceof THREE.Mesh))return;
   o.castShadow=o.name.endsWith('_main');o.receiveShadow=!o.name.startsWith('reference_photo');
   for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof THREE.MeshStandardMaterial&&!seen.has(m)){
    seen.add(m);if(o.name.endsWith('_glow')){m.emissive.set(0xffffff);m.emissiveIntensity=.04;emissive.push(m);m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance *= vColor.rgb;\n#endif');};m.customProgramCacheKey=()=> 'museum-colored-glow';}
   }
  });
 }
 function apply(){
  const t=night;sun.intensity=2.7*(1-t);sun.castShadow=t<.99;sky.intensity=THREE.MathUtils.lerp(.32,.035,t);moon.intensity=t*.11;
  scene.environmentIntensity=THREE.MathUtils.lerp(.22,.045,t);(scene.background as THREE.Color).copy(daySky).lerp(nightSky,t);
  for(let i=0;i<lamps.length;i++){
   lamps[i].intensity=t*(i<8?13:i<13?75:20);
   if(lamps[i] instanceof THREE.SpotLight)lamps[i].castShadow=t>.01;
  }
  for(const m of emissive)m.emissiveIntensity=THREE.MathUtils.lerp(.04,4.5,t);
  onExposure(THREE.MathUtils.lerp(1.0,1.12,t));
 }
 apply();
 return {registerModel,setNight(value:boolean){target=value?1:0;},update(dt:number){night=THREE.MathUtils.damp(night,target,3.8,dt);if(Math.abs(night-target)<.001)night=target;apply();return night;},dispose(){scene.remove(sun,sun.target,sky,moon,...lamps,...owned);sun.shadow.dispose();for(const l of lamps)if(l instanceof THREE.SpotLight)l.shadow.dispose();}};
}

export function createMuseumLighting(scene:THREE.Scene,renderer:THREE.WebGLRenderer){
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();const environment=pmrem.fromScene(room,.05);room.dispose();pmrem.dispose();scene.environment=environment.texture;
 const rig=createDayNightRig(scene,value=>{renderer.toneMappingExposure=value});
 return {...rig,dispose(){rig.dispose();scene.environment=null;environment.dispose();}};
}
