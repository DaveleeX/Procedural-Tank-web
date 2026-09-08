import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createVisitors} from '../lib/museum-visitors.ts';
const scene=new THREE.Scene();const controller=createVisitors(scene);
const people=scene.getObjectByName('Dynamic museum visitors').children;
assert.equal(people.length,3);
const initial=people.map(p=>p.position.clone());let maxSwing=0,maxX=0,minZ=Infinity,maxZ=-Infinity;
for(let frame=0;frame<60*180;frame++){
 controller.update(1/60);
 maxSwing=Math.max(maxSwing,...people[0].children[0].children.map(p=>Math.abs(p.rotation.x)));
 for(const p of people){assert(Number.isFinite(p.rotation.y));maxX=Math.max(maxX,Math.abs(p.position.x));minZ=Math.min(minZ,p.position.z);maxZ=Math.max(maxZ,p.position.z);assert(Math.abs(p.position.x)<3.95);assert(p.position.z>-16.4&&p.position.z<21);}
}
for(let i=0;i<3;i++)assert(people[i].position.distanceTo(initial[i])>1);
assert(maxSwing>.3);
controller.dispose();assert.equal(scene.children.length,0);
const report={visitors:3,simulatedSeconds:180,pathWithinWalkway:true,maxX,minZ,maxZ,animatedLimbs:true,disposed:true};
fs.writeFileSync('visitor-verification.json',JSON.stringify(report,null,2));console.log(report);
