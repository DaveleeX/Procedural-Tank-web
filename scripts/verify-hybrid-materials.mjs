import assert from 'node:assert/strict';
import * as THREE from 'three';
import {bindMuseumMaterials} from '../lib/museum-materials.ts';
const fetchBefore=globalThis.fetch,loadBefore=THREE.TextureLoader.prototype.loadAsync;
const row={mesh:'01_tank_main',files:{day:'day.webp',night:'night.webp',orm:'orm.webp',hdAlbedo:'albedo_hd.webp',hdDay:'day_hd.webp',hdNight:'night_hd.webp',hdOrm:'orm_hd.webp'}};
globalThis.fetch=async()=>({ok:true,json:async()=>({atlases:[row]})});
THREE.TextureLoader.prototype.loadAsync=async function(url){const t=new THREE.Texture();t.name=url;return t};
try{
 const model=new THREE.Group(),m=new THREE.MeshStandardMaterial({map:new THREE.Texture()}),mesh=new THREE.Mesh(new THREE.BoxGeometry(),m);mesh.name=row.mesh;model.add(mesh);
 const controller=await bindMuseumMaterials(model,{capabilities:{getMaxAnisotropy:()=>16}},new AbortController().signal);
 assert.equal(m.lightMap.channel,0);assert.equal(m.aoMap.colorSpace,THREE.NoColorSpace);assert.equal(m.lightMap.colorSpace,THREE.SRGBColorSpace);assert.equal(m.lightMapIntensity,Math.PI);
 const shader={uniforms:{},fragmentShader:THREE.ShaderLib.physical.fragmentShader};m.onBeforeCompile(shader);
 assert(shader.fragmentShader.includes('mix( texture2D( lightMap'));
 controller.mix.value=1;assert.equal(shader.uniforms.nightBlend.value,1);assert(shader.uniforms.nightIndirect.value.name.endsWith('night.webp'));
 await controller.focus(0);assert(m.map.name.endsWith('albedo_hd.webp'));assert(shader.uniforms.nightIndirect.value.name.endsWith('night_hd.webp'));
 await controller.focus(-1);assert(m.lightMap.name.endsWith('day.webp'));controller.dispose();mesh.geometry.dispose();m.map.dispose();m.dispose();
 console.log('PBR indirect-only shader, independent AO, day/night interpolation and HD texture switching passed');
}finally{globalThis.fetch=fetchBefore;THREE.TextureLoader.prototype.loadAsync=loadBefore;}
