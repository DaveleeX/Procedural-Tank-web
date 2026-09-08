import * as THREE from 'three';
import { museumAsset } from './museum-assets';
type Atlas={mesh:string;day_scale?:number;night_scale?:number;files:{day:string;night:string;orm:string;hdAlbedo:string;hdDay:string;hdNight:string;hdOrm:string}};
type SetMaps={day:THREE.Texture;night:THREE.Texture;orm:THREE.Texture;albedo:THREE.Texture|null};
export async function bindMuseumMaterials(model:THREE.Object3D,renderer:THREE.WebGLRenderer,signal:AbortSignal){
 const data=await fetch(museumAsset('/museum/model-hybrid/lighting.json'),{signal}).then(r=>{if(!r.ok)throw Error('Lighting manifest unavailable');return r.json()}) as {atlases:Atlas[]};
 const loader=new THREE.TextureLoader(),mix={value:0};const owned=new Set<THREE.Texture>();let disposed=false,selection=-1,epoch=0;
 async function texture(path:string,color:boolean){
  const t=await loader.loadAsync(museumAsset('/museum/model-hybrid/'+path));t.flipY=false;t.channel=0;t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());
  if(disposed){t.dispose();throw Error('Material loading cancelled')}owned.add(t);return t;
 }
 const bindings: {row:Atlas;m:THREE.MeshStandardMaterial;low:SetMaps;high:SetMaps|null;nightUniform:{value:THREE.Texture}}[]=[];
 function release(set:SetMaps){for(const t of [set.day,set.night,set.orm,set.albedo])if(t&&owned.has(t)){t.dispose();owned.delete(t)}}
 try{
  await Promise.all(data.atlases.map(async row=>{
   const mesh=model.getObjectByName(row.mesh) as THREE.Mesh|undefined;if(!mesh)throw Error('Missing atlas mesh '+row.mesh);
   const m=mesh.material as THREE.MeshStandardMaterial;if(!m.isMeshStandardMaterial)throw Error('Hybrid surface must use PBR');
   const [day,night,orm]=await Promise.all([texture(row.files.day,true),texture(row.files.night,true),texture(row.files.orm,false)]);
   const low={day,night,orm,albedo:m.map};const nightUniform={value:night};
   m.lightMap=day;m.lightMapIntensity=Math.PI;m.aoMap=orm;m.aoMapIntensity=.4;m.roughnessMap=orm;m.metalnessMap=orm;m.roughness=1;m.metalness=1;
   m.onBeforeCompile=shader=>{shader.uniforms.dayScale={value:row.day_scale||1};shader.uniforms.nightScale={value:row.night_scale||1};shader.uniforms.nightBlend=mix;shader.uniforms.nightIndirect=nightUniform;
    shader.fragmentShader='uniform float dayScale;\nuniform float nightScale;\nuniform float nightBlend;\nuniform sampler2D nightIndirect;\n'+shader.fragmentShader;
    const lightmapChunk=THREE.ShaderChunk.lights_fragment_maps.replace('texture2D( lightMap, vLightMapUv )','mix( texture2D( lightMap, vLightMapUv ) * dayScale, texture2D( nightIndirect, vLightMapUv ) * nightScale, nightBlend )');
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_maps>',lightmapChunk);
   };m.customProgramCacheKey=()=> 'museum-indirect-day-night-v1';m.needsUpdate=true;
   bindings.push({row,m,low,high:null,nightUniform});
  }));
 }catch(e){disposed=true;owned.forEach(t=>t.dispose());throw e;}
 function apply(b:typeof bindings[number],set:SetMaps){b.m.map=set.albedo;b.m.lightMap=set.day;b.m.aoMap=set.orm;b.m.roughnessMap=set.orm;b.m.metalnessMap=set.orm;b.nightUniform.value=set.night;}
 async function focus(index:number){
  if(selection===index||disposed)return;selection=index;const request=++epoch;
  for(const b of bindings)if(b.high){apply(b,b.low);release(b.high);b.high=null;}
  if(index<0)return;
  // Only the approached exhibit uses full resolution; the rest retain overview mip detail.
  const selected=bindings.filter(b=>b.row.mesh.startsWith(`0${index+1}_`));
  await Promise.all(selected.map(async b=>{
   let high:SetMaps|null=null;
   try{
    const results=await Promise.allSettled([texture(b.row.files.hdAlbedo,true),texture(b.row.files.hdDay,true),texture(b.row.files.hdNight,true),texture(b.row.files.hdOrm,false)]);
    const loaded=results.flatMap(r=>r.status==='fulfilled'?[r.value]:[]);
    if(loaded.length!==4){for(const t of loaded){t.dispose();owned.delete(t)}return;}
    const [albedo,day,night,orm]=loaded;
    high={albedo,day,night,orm};if(disposed||request!==epoch){release(high);return;}b.high=high;apply(b,high);
   }catch{if(high)release(high);/* Overview textures remain valid if an optional high-detail request fails. */}
  }));
 }
 return {mix,focus,dispose(){disposed=true;epoch++;for(const b of bindings)apply(b,b.low);owned.forEach(t=>t.dispose());owned.clear();}};
}
