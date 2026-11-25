import * as THREE from 'three';
import {OrbitControls} from '/vendor/OrbitControls.js';
import {buildExplorer, buildObject, buildRuins} from './observatory.js';

const centre = new THREE.Vector3(7, .65, 4.0);
const homeDirection = new THREE.Vector3(4.3, 12.5, 17).normalize();
function homeDistance(aspect) {
  return Math.max(18.4, 32.3 / aspect);
}
export function createCamera(aspect) {
  const camera = new THREE.PerspectiveCamera(35, aspect, .15, 160);
  camera.position.copy(centre).addScaledVector(homeDirection, homeDistance(aspect));
  camera.lookAt(centre);
  camera.updateMatrixWorld();
  return camera;
}
function water(scene) {
  const material = new THREE.ShaderMaterial({
    uniforms: {seconds: {value: 0}},
    vertexShader: `
      varying vec3 positionWorld;
      void main() {
        positionWorld = (modelMatrix * vec4(position, 1.)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(positionWorld, 1.);
      }`,
    fragmentShader: `
      uniform float seconds;
      varying vec3 positionWorld;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
                   mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);
      }
      void main() {
        vec2 p=positionWorld.xz;
        float t=seconds*.46;
        float shoal=noise(p*.29);
        vec3 color=mix(vec3(.014,.078,.102),vec3(.045,.21,.205),shoal);
        // Dark water under the overhanging terraces gives the islands a submerged base.
        vec2 west=max(abs(p-vec2(4.,5.5))-vec2(3.5,3.),0.);
        vec2 east=max(abs(p-vec2(11.5,4.))-vec2(2.,2.5),0.);
        float shore=min(length(west),length(east));
        color*=mix(.44,1.,smoothstep(.0,1.3,shore));
        float foam=1.-smoothstep(.012,.058,abs(shore-.13-.04*sin(t+p.x*3.)));
        color+=vec3(.06,.12,.10)*foam*smoothstep(.24,.68,shoal);
        float bend=noise(p*.7+vec2(t*.12,0.));
        float ripple=sin(p.y*14.+p.x*2.3+bend*12.+t*2.);
        float glint=smoothstep(.87,.99,ripple)*smoothstep(.52,.84,noise(vec2(p.x*2.-t*.21,p.y*4.)));
        color+=vec3(.085,.16,.15)*glint;
        float distanceToShore=distance(p,vec2(6.,4.));
        color=mix(color,vec3(.095,.19,.20),smoothstep(12.,48.,distanceToShore));
        gl_FragColor=vec4(color,1.);
        #include <colorspace_fragment>
      }`
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(260,260), material);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -.68;
  scene.add(sea);
  return material;
}

function lightScene(scene) {
  scene.add(new THREE.HemisphereLight(0xe2efff, 0x608582, 1.38));
  const sun = new THREE.DirectionalLight(0xffdeb2, 2.35);
  sun.position.set(-4, 16, 9);
  sun.target.position.copy(centre);
  scene.add(sun, sun.target);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, {left:-13,right:13,top:11,bottom:-11,near:.5,far:43});
  sun.shadow.mapSize.set(1024,1024);
  sun.shadow.normalBias = .025;
}

function lightBeam(scene) {
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,1,7),
    new THREE.MeshBasicMaterial({color:0xffdb89, transparent:true, opacity:.74}));
  scene.add(beam);
  return beam;
}
const up = new THREE.Vector3(0,1,0);
function placeBeam(beam, from, to, enabled) {
  beam.visible = Boolean(enabled && from && to);
  if (!beam.visible) return;
  const a = new THREE.Vector3(from.x, 1.12, from.y);
  const direction = new THREE.Vector3(to.x,.92,to.y).sub(a);
  beam.position.copy(a).addScaledVector(direction,.5);
  beam.scale.y = direction.length();
  beam.quaternion.setFromUnitVectors(up,direction.normalize());
}

export function createScene(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'low-power'});
  } catch {
    document.getElementById('graphics-error').hidden = false;
    document.getElementById('reset-camera').disabled = true;
    return {draw() {}, pick() {return null;}};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#52777b');
  scene.fog = new THREE.FogExp2('#668589', .025);
  lightScene(scene);
  const sea = water(scene);
  buildRuins(scene);
  const explorer = buildExplorer();
  scene.add(explorer);
  const beams = [lightBeam(scene), lightBeam(scene)];
  const marker = new THREE.Mesh(new THREE.RingGeometry(.32,.39,32),
    new THREE.MeshBasicMaterial({color:0xffe1aa, transparent:true, opacity:.85}));
  marker.rotation.x = -Math.PI / 2;
  scene.add(marker);

  const camera = createCamera(canvas.clientWidth / canvas.clientHeight);
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(centre);
  controls.enablePan = false;
  controls.minDistance = 6;
  controls.maxDistance = 35;
  controls.minPolarAngle = .19;
  controls.maxPolarAngle = Math.PI / 2.85;
  controls.rotateSpeed = .65;
  controls.zoomSpeed = .8;
  controls.update();
  document.getElementById('reset-camera').onclick = () => {
    controls.target.copy(centre);
    camera.position.copy(centre).addScaledVector(homeDirection, homeDistance(camera.aspect));
    controls.update();
  };
  function resize() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    const aspect = width / height;
    const relativeZoom = homeDistance(aspect) / homeDistance(camera.aspect);
    camera.position.sub(controls.target).multiplyScalar(relativeZoom).add(controls.target);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    controls.update();
    renderer.setSize(width,height,false);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  const hoverName = document.getElementById('hover-name');
  const objects = new Map();
  const interactables = new THREE.Group();
  scene.add(interactables);
  const ray = new THREE.Raycaster();
  const floor = new THREE.Plane(up,0);
  const point = new THREE.Vector3();
  function pick(clientX,clientY) {
    const rect = canvas.getBoundingClientRect();
    ray.setFromCamera({
      x: (clientX-rect.left)/rect.width*2-1,
      y: 1-(clientY-rect.top)/rect.height*2
    },camera);
    for (const hit of ray.intersectObjects(interactables.children,true)) {
      let node = hit.object;
      while (node.visible && !node.userData.entityId && node.parent) node = node.parent;
      if (node.visible && node.userData.entityId) {
        return {x:node.position.x, y:node.position.z, id:node.userData.entityId};
      }
    }
    if (!ray.ray.intersectPlane(floor,point)) return null;
    return {x:Math.round(point.x), y:Math.round(point.z)};
  }
  function draw(world, milliseconds, pointer) {
    const seconds = milliseconds / 1000;
    sea.uniforms.seconds.value = seconds;
    for (const [id, object] of objects) {
      if (world.entities[id]?.kind !== object.kind) {
        renderer.shadowMap.needsUpdate = true;
        object.node.removeFromParent();
        objects.delete(id);
      }
    }
    for (const entity of Object.values(world.entities)) {
      let object = objects.get(entity.id);
      if (!object) {
        renderer.shadowMap.needsUpdate = true;
        object = buildObject(entity.kind);
        object.node.userData.entityId = entity.id;
        (entity.kind === 'bridge' ? scene : interactables).add(object.node);
        objects.set(entity.id, object);
      }
      if (object.node.position.x !== entity.x || object.node.position.z !== entity.y ||
          object.active.visible !== entity.on) renderer.shadowMap.needsUpdate = true;
      object.node.position.set(entity.x,0,entity.y);
      object.active.visible = entity.on;
      if (object.kind === 'gate') object.moving.scale.y = entity.on ? .09 : 1;
      else if (object.moving) object.moving.rotation.y = entity.on ? seconds * .55 : .35;
    }
    const dx = world.player.x - explorer.position.x, dz = world.player.y - explorer.position.z;
    if (dx || dz) {
      explorer.rotation.y = Math.atan2(dx,dz);
      renderer.shadowMap.needsUpdate = true;
    }
    explorer.position.set(world.player.x,0,world.player.y);
    placeBeam(beams[0],world.entities.beacon,world.entities.lens,world.vars.aligned);
    placeBeam(beams[1],world.entities.lens,world.entities.orrery,world.vars.awake);
    scene.updateMatrixWorld(true);
    const hover = pointer && pick(pointer.x,pointer.y);
    const name = world.entities[hover?.id]?.name || '';
    if (hoverName.textContent !== name) {
      hoverName.textContent = name;
      hoverName.hidden = !name;
    }
    marker.visible = Boolean(hover && hover.x >= 1 && hover.x <= 14 && hover.y >= 1 && hover.y <= 9);
    if (marker.visible) marker.position.set(hover.x,.035,hover.y);
    renderer.render(scene,camera);
  }
  return {draw,pick};
}
