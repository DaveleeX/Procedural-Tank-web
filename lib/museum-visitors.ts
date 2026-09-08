import * as THREE from 'three';

/** Dynamic visitors never enter the static Cycles bake or the museum atlas. */
export function createVisitors(scene: THREE.Scene) {
 const group = new THREE.Group(); group.name = 'Dynamic museum visitors'; scene.add(group);
 const materials = [
  new THREE.MeshStandardMaterial({color:new THREE.Color(.12,.23,.3),roughness:.88}),
  new THREE.MeshStandardMaterial({color:new THREE.Color(.49,.32,.22),roughness:.85}),
  new THREE.MeshStandardMaterial({color:new THREE.Color(.035,.045,.048),roughness:.9}),
 ];
 const sphere = new THREE.SphereGeometry(1,16,12);
 const cylinder = new THREE.CylinderGeometry(1,1,1,12);
 function part(parent:THREE.Object3D,geometry:THREE.BufferGeometry,material:number,position:number[],scale:number[]){
  const mesh=new THREE.Mesh(geometry,materials[material]);mesh.position.fromArray(position);mesh.scale.fromArray(scale);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 const points=[[-2.7,14],[-3,-2],[-2.5,-13],[0,-15],[2.7,-12],[3,2],[2.5,14],[0,15.5]].map(([x,z])=>new THREE.Vector3(x,.04,z));
 const path=new THREE.CatmullRomCurve3(points,true,'centripetal');path.arcLengthDivisions=1000;
 const length=path.getLength();
 const visitors=Array.from({length:3},(_,i)=>{
  const root=new THREE.Group();root.name=`Walking visitor ${i+1}`;group.add(root);
  const body=new THREE.Group();root.add(body);
  part(body,sphere,0,[0,.96,0],[.21,.37,.14]);
  part(body,sphere,1,[0,1.42,0],[.12,.15,.11]);
  const limbs:THREE.Group[]=[];
  for(const side of [-1,1]){
   const leg=new THREE.Group();leg.position.set(side*.075,.66,0);body.add(leg);
   part(leg,cylinder,2,[0,-.30,0],[.055,.60,.055]);
   part(leg,sphere,2,[0,-.57,.035],[.062,.065,.10]);limbs.push(leg);
  }
  for(const side of [-1,1]){
   const arm=new THREE.Group();arm.position.set(side*.19,1.15,0);body.add(arm);
   part(arm,cylinder,0,[side*.025,-.18,0],[.045,.36,.045]);
   part(arm,sphere,1,[side*.025,-.365,0],[.048,.055,.048]);limbs.push(arm);
  }
  return {root,body,limbs,offset:i/3,speed:.54+i*.045};
 });
 let elapsed=0;
 function update(dt:number){
  elapsed+=dt;
  for(const person of visitors){
   const distance=elapsed*person.speed;
   const t=(person.offset+distance/length)%1;
   person.root.position.copy(path.getPointAt(t));
   const tangent=path.getTangentAt(t);person.root.rotation.y=Math.atan2(tangent.x,tangent.z);
   const cycle=distance/.72*Math.PI*2+person.offset*Math.PI*2;
   const swing=Math.sin(cycle)*.34;
   person.limbs[0].rotation.x=swing;person.limbs[1].rotation.x=-swing;
   person.limbs[2].rotation.x=-swing*.72;person.limbs[3].rotation.x=swing*.72;
   person.body.position.y=Math.abs(Math.sin(cycle))*.018;
  }
 }
 update(0);
 return {update,dispose(){scene.remove(group);sphere.dispose();cylinder.dispose();materials.forEach(m=>m.dispose());}};
}
