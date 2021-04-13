// Find the latest version by visiting https://unpkg.com/three.          
import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import { GUI } from 'https://unpkg.com/three@0.127.0/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'https://unpkg.com/three@0.127.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.127.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.127.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import Stats from 'https://unpkg.com/three@0.127.0/examples/jsm/libs/stats.module';

const loader = new GLTFLoader();

// const controls = new OrbitControls();
const scene = new THREE.Scene();
loader.load('WebsiteScene.glb', function(gltf) {
    console.log(gltf.scene);
    scene.add(gltf.scene);
    configGLTBScene();
    init();
    animate();
})

let stats = new Stats();

// var scene = new THREE.Scene();
const fov = 80;
const aspect = 1.8;  // the canvas default
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
let cameraPosition = new THREE.Vector3(0, 2, 10);
let cameraLookAtPosition = new THREE.Vector3(0, 0, 0); // TODO: Lerp between objects via tweening
let lookAtObject = new THREE.Object3D();

camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
var renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
// renderer.setPixelRatio( window.devicePixelRatio );
// renderer.setSize( window.innerWidth, window.innerHeight );
// renderer.toneMapping = THREE.ReinhardToneMapping;

var canvas = renderer.domElement;
document.body.appendChild(canvas);
const controls = new OrbitControls( camera, renderer.domElement );

var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -10);
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var look = new THREE.Vector2();
var pointOfIntersection = new THREE.Vector3();

canvas.addEventListener("mousemove", onMouseMove, false);

const PPParams = {
    exposure: 1,
    bloomStrength:  0.7,
    bloomThreshold: 0,
    bloomRadius: 0
};

function onMouseMove(event){
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

let texturePaths = ['Textures/Phipson.jpg', "Textures/Lee_Aaron.jpg", "Textures/Mohan_Divya.JPG", "Textures/Chen_Maggie.JPG", "Textures/Suazo_Gabriela.jpg"]
function configGLTBScene() {
    // Add all the about me panel pages
    for (let i = 0; i < 5; i++) {
        let texture = new THREE.TextureLoader().load(texturePaths[i]);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(0.6, -1);
        texture.offset.set(0.18, 0);
        scene.getObjectByName(`Panel_${i+1}`, true).material = new THREE.MeshLambertMaterial( { map:  texture } );
    }

    // Add TV Video Texture
    video = document.getElementById( 'mainTV' );
    video.play();

    texture = new THREE.VideoTexture( video );
    texture.minFilter = THREE.NearestFilter;

    const parameters = { map: texture, emissiveIntensity: 3.0 };
    scene.getObjectByName("TV", true).material = new THREE.MeshBasicMaterial( { map:  texture } );

}

let video, texture, material, mesh, box, composer, effectFXAA;
function init() {

    // var box = new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshLambertMaterial( parameters ));
    // box.geometry.translate(0, 0, 0.5);
    // box.scale.set(1, 0.6, 0.5);
    // box.castShadow = true;
    // scene.add(box);
    // scene.add( new THREE.AmbientLight( 0x404040 ) );
    lookAtObject.position.x = 0; lookAtObject.position.y = 0; lookAtObject.position.z = 0; 
    scene.add(lookAtObject)

    const color = 0x0;
    const density = 0.15;
    scene.fog = new THREE.FogExp2(color, density);

    // POST PROCESSING
    const renderScene = new RenderPass( scene, camera );
    const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, .85 );
    bloomPass.threshold = PPParams.bloomThreshold;
    bloomPass.strength = PPParams.bloomStrength;
    bloomPass.radius = PPParams.bloomRadius;

    // renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // effectFXAA = new ShaderPass( THREE.FXAAShader );
    // renderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight , renderTargetParameters );

    composer = new EffectComposer( renderer );
    composer.addPass( renderScene );
    composer.addPass( bloomPass );
    // composer.addPass(effectFXAA );

    const gui = new GUI();

    gui.add( PPParams, 'exposure', 0.1, 2 ).onChange( function ( value ) {

        renderer.toneMappingExposure = Math.pow( value, 4.0 );

    } );

    gui.add( PPParams, 'bloomThreshold', 0.0, 1.0 ).onChange( function ( value ) {

        bloomPass.threshold = Number( value );

    } );

    gui.add( PPParams, 'bloomStrength', 0.0, 3.0 ).onChange( function ( value ) {

        bloomPass.strength = Number( value );

    } );

    gui.add( PPParams, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {

        bloomPass.radius = Number( value );

    } );

    document.body.appendChild(stats.dom);
    document.body.addEventListener('keydown', keyPressed);
    document.body.addEventListener('resize', onWindowResize)

    setupTween();
    gui.open();
}

var easeAmount = 8;
var sensitivity = 0.0005;
function update() {
    if (spotLightHelper) spotLightHelper.update();
    lookAtObject.position.x = cameraLookAtPosition.x;
    lookAtObject.position.y = cameraLookAtPosition.y;
    lookAtObject.position.z = cameraLookAtPosition.z;

    look.x += (mouse.x-look.x)/easeAmount;
    look.y += (mouse.y-look.y)/easeAmount;
    
    camera.position.x = cameraPosition.x + look.x * window.innerWidth * sensitivity;
    camera.position.y = cameraPosition.y + look.y * window.innerHeight * sensitivity;
    camera.position.z = cameraPosition.z;

    camera.lookAt(lookAtObject.position);

    // controls.update();
    stats.update();
    TWEEN.update();

    // raycaster.setFromCamera(look, camera);
    // raycaster.ray.intersectPlane(plane, pointOfIntersection);
    // box.lookAt(pointOfIntersection);
}

function animate() 
{
    requestAnimationFrame( animate );
    // setTimeout( function() {
    //     requestAnimationFrame( animate );
    // }, 1000 / 30 );
    composer.render();
    // render();		
    update();
}

function render() 
{	
    if ( video.readyState === video.HAVE_ENOUGH_DATA ) 
    {
        if ( texture ) 
            texture.needsUpdate = true;
    }

    if (resize(renderer)) {
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }

    renderer.render( scene, camera );
}

function resize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function keyPressed(e) {
    switch(e.key) {
        case 'ArrowLeft':
            cameraTweenIndex = cameraTweenIndex - 1 < 0 ? objectFocusNames.length - 1 : cameraTweenIndex - 1;
            updateCameraTransform();
            updateSpotlight(cameraPositions[cameraTweenIndex], spotlightColors[cameraTweenIndex]);
            break;
        case 'ArrowRight':
            cameraTweenIndex = cameraTweenIndex + 1 >= objectFocusNames.length ? 0 : cameraTweenIndex + 1;
            updateCameraTransform();
            updateSpotlight(cameraPositions[cameraTweenIndex], spotlightColors[cameraTweenIndex]);
            break;
    }
    e.preventDefault();
}

let objectFocusNames = ["TV", "Plane010", "Panel_3"]
let cameraPositionNames = ["Position_Main", "Position_CurrentResearch", "Position_About"]
let lookAtPositions = []
let cameraPositions = []
let cameraTweenIndex = 0;

let spotlight, spotLightHelper;
let spotlightPositions = [];
let spotlightColors = [0xe3fdfd, 0xeaeaea, 0xffe2e2];
function setupTween() {
    TWEEN.removeAll();

    spotlight = createSpotlight(0xe3fdfd);
    scene.add(spotlight);

    // spotLightHelper = new THREE.SpotLightHelper( spotlight );
    // scene.add( spotLightHelper );

    objectFocusNames.forEach((objName, i) => {
        console.log(objName);
        let obj = scene.getObjectByName(objName, true);
        const camPos = scene.getObjectByName(cameraPositionNames[i], true).position;
        lookAtPositions.push(obj.position);
        cameraPositions.push(new THREE.Vector3(camPos.x, camPos.y, camPos.z));

        //
        // let pointLight = new THREE.PointLight( 0xffffff, 1 );
        // const pos = scene.getObjectByName("TV", true).position;
        // pointLight.position.set(camPos.x, 1, camPos.z);
        // scene.add( pointLight );
    })

    updateSpotlight(cameraPositions[cameraTweenIndex], spotlightColors[cameraTweenIndex]);
    updateCameraTransform();
}

function updateCameraTransform() {
    let tempPos = cameraPosition;
    let newCamPos = cameraPositions[cameraTweenIndex];
    let tempLookAt = lookAtObject.position;
    let newLookAt = lookAtPositions[cameraTweenIndex];

    // console.log(newCamPos);

    new TWEEN.Tween(tempPos)
    .to(newCamPos, 2000)
    .easing (TWEEN.Easing.Cubic.InOut)
    .onUpdate(function() { cameraPosition = tempPos; })
    .start();

    new TWEEN.Tween(tempLookAt)
    .to(newLookAt, 2000)
    .easing (TWEEN.Easing.Cubic.InOut)
    .onUpdate(function() { cameraLookAtPosition = tempLookAt; })
    .start();
}

function createSpotlight(color) {
    const newObj = new THREE.SpotLight(color, 2);

    newObj.castShadow = true;
    newObj.angle = 0.5;
    newObj.penumbra = 0.5;
    newObj.decay = 2;
    newObj.distance = 20;
    newObj.target = lookAtObject;

    return newObj;
}

function updateSpotlight(targetPos, targetColor) {
    let tempPosition = spotlight.target.position;

    new TWEEN.Tween(spotlight.position)
    .to({x: targetPos.x, y: 10, z: targetPos.z}, 1000)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start();

    // new TWEEN.Tween(tempPosition)
    // .to(lookAtPositions[cameraTweenIndex], 1000)
    // .easing(TWEEN.Easing.Cubic.InOut)
    // .onUpdate(function() {spotlight.target.position.set(tempPosition) })
    // .start();

    // new TWEEN.Tween(spotlight.color)
    // .to(spotlightColors[cameraTweenIndex], 1000)
    // .easing(TWEEN.Easing.Cubic.InOut)
    // .start();
    spotlight.color.setHex(spotlightColors[cameraTweenIndex]);
}