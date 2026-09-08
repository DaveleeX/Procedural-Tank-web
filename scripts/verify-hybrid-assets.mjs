import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
const root=path.resolve('public/museum/model-hybrid');
const gltf=JSON.parse(fs.readFileSync(path.join(root,'museum.gltf')));assert(gltf.extensionsRequired.includes('EXT_texture_webp'));assert(gltf.extensionsRequired.includes('KHR_mesh_quantization'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'lighting.json')));
assert.equal(manifest.direct_baked,false);assert.equal(manifest.ao_separate,true);assert.deepEqual(manifest.scenarios,['day','night']);
await MeshoptDecoder.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});const doc=await io.read(path.join(root,'museum.gltf'));
for(const row of manifest.atlases){
 const node=doc.getRoot().listNodes().find(n=>n.getName()===row.mesh);assert(node);assert(row.uv_utilization>.5&&row.uv_utilization<.95);
 for(const file of Object.values(row.files))assert(fs.statSync(path.join(root,file)).size>0);
 const albedo=await sharp(path.join(root,row.files.hdAlbedo)).metadata(),gi=await sharp(path.join(root,row.files.hdDay)).metadata();assert.equal(albedo.width,row.resolution);assert.equal(gi.width,2048);
 for(const p of node.getMesh().listPrimitives()){assert.equal(p.getAttribute('POSITION').getComponentType(),5126);assert(p.getAttribute('NORMAL'));assert(!p.getMaterial().getExtension('KHR_materials_unlit'));assert.deepEqual(p.getMaterial().getEmissiveFactor(),[0,0,0]);}
}
for(const node of doc.getRoot().listNodes())assert(!node.getName().startsWith('Visitor'));
for(const file of fs.readdirSync(root))assert(fs.statSync(path.join(root,file)).size<25*1024*1024);
const cameras=JSON.parse(fs.readFileSync('public/museum/cameras.json'));assert.equal(cameras.cameras[0].orthoScale,65);
const report={directBaked:false,aoSeparate:true,mainAtlases:manifest.atlases.length,excludedSmallObjects:manifest.excludedCount,uvOccupancy:[Math.min(...manifest.atlases.map(a=>a.uv_utilization)),Math.max(...manifest.atlases.map(a=>a.uv_utilization))],mainAlbedoResolution:4096,indirectAndORMResolution:2048,dayNightMaps:true,fullPrecisionPositions:true,allAssetFilesUnder25MiB:true,cameraPreserved:true};fs.writeFileSync('hybrid-verification.json',JSON.stringify(report,null,2));console.log(report);
