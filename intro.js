// -----------------------------
// Horizontal Drag Engine
// -----------------------------

const slider = document.getElementById("dragContainer");
const panels = document.querySelectorAll(".intro-panel");

let isDown = false;
let startX = 0;
let scrollLeft = 0;
let targetScroll = 0;

slider.addEventListener("mousedown", e => {

    isDown = true;

    startX = e.pageX;

    scrollLeft = targetScroll;

});

window.addEventListener("mouseup", () => isDown = false);

window.addEventListener("mousemove", e => {

    if(!isDown) return;

    const walk = (e.pageX - startX) * 2;

    targetScroll = scrollLeft - walk;

});

slider.addEventListener("wheel", e => {

    e.preventDefault();

    targetScroll += e.deltaY;

},{passive:false});



// -----------------------------
// Three.js Background
// -----------------------------

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(

70,

window.innerWidth/window.innerHeight,

0.1,

1000

);

camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({

    canvas: document.getElementById("bgCanvas"),

    antialias: true,

    alpha: true

});

renderer.setSize(window.innerWidth, window.innerHeight);

renderer.setPixelRatio(window.devicePixelRatio);

// ------------------------------------
// Hidden canvas for VAELOS particles
// ------------------------------------

const textCanvas = document.createElement("canvas");
const textCtx = textCanvas.getContext("2d");

textCanvas.width = 1400;
textCanvas.height = 500;

textCtx.fillStyle = "white";
textCtx.textAlign = "center";
textCtx.textBaseline = "middle";

textCtx.font = "900 220px Syne";

textCtx.fillText(
    "VAELOS",
    textCanvas.width / 2,
    textCanvas.height / 2
);

const imageData = textCtx.getImageData(
    0,
    0,
    textCanvas.width,
    textCanvas.height
).data;

const vertices = [];
const targets = [];

for (let y = 0; y < textCanvas.height; y += 4) {

    for (let x = 0; x < textCanvas.width; x += 4) {

        const index = (y * textCanvas.width + x) * 4;

        if (imageData[index + 3] > 150) {

            vertices.push(
                (Math.random() - 0.5) * 150,
                (Math.random() - 0.5) * 150,
                (Math.random() - 0.5) * 150
            );

            targets.push(
                (x - textCanvas.width / 2) * 0.04,
                -(y - textCanvas.height / 2) * 0.04,
                0
            );

        }

    }

}

const geometry = new THREE.BufferGeometry();

geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
);

const targetPositions = targets;

const material = new THREE.PointsMaterial({

color:0x8fe7ff,

size:0.06,

transparent:true,

opacity:1,

depthWrite:false,

blending:THREE.AdditiveBlending

});

const particles = new THREE.Points(

geometry,

material

);

scene.add(particles);

// -----------------------------
// Particle Explosion Intro
// -----------------------------

let introProgress = 0;

const originalPositions = geometry.attributes.position.array.slice();

for(let i=0;i<originalPositions.length;i+=3){

    geometry.attributes.position.array[i]=0;

    geometry.attributes.position.array[i+1]=0;

    geometry.attributes.position.array[i+2]=0;

}

geometry.attributes.position.needsUpdate=true;



// -----------------------------
// Mouse Reaction
// -----------------------------

let mouseX = 0;
let mouseY = 0;
let cameraTargetX = 0;
let cameraTargetY = 0;

window.addEventListener("mousemove",(e)=>{

mouseX=(e.clientX/window.innerWidth-.5)*2;

mouseY=(e.clientY/window.innerHeight-.5)*2;

cameraTargetX=mouseX*2.5;

cameraTargetY=-mouseY*2;

});



// -----------------------------
// Hero Animation
// -----------------------------

const hero = document.querySelector(".hero-title");

hero.style.opacity = "0";
hero.style.transform = "translateY(120px) scale(.75)";
hero.style.filter = "blur(25px)";

setTimeout(()=>{

hero.style.transition=`
opacity 1.4s ease,
transform 1.6s cubic-bezier(.2,.9,.2,1),
filter 1.6s ease
`;

hero.style.opacity="1";

hero.style.transform="translateY(0px) scale(1)";

hero.style.filter="blur(0px)";

},400);

let heroTime=0;



// -----------------------------
// Main Loop
// -----------------------------

function animate(){

requestAnimationFrame(animate);



targetScroll += (slider.scrollLeft-targetScroll)*0;

slider.scrollLeft += (targetScroll-slider.scrollLeft)*.08;

// Intro Explosion

if(introProgress < 1){

introProgress += 0.008;

const arr = geometry.attributes.position.array;

for(let i=0;i<arr.length;i++){

arr[i] += (originalPositions[i]-arr[i])*introProgress*0.04;

}

geometry.attributes.position.needsUpdate=true;

}


    camera.position.x += (cameraTargetX-camera.position.x)*0.03;

camera.position.y += (cameraTargetY-camera.position.y)*0.03;

camera.lookAt(scene.position);
    
particles.rotation.y += .0004;

particles.rotation.x += (mouseY*.2-particles.rotation.x)*.02;

particles.rotation.y += (mouseX*.2-particles.rotation.y)*.02;



panels.forEach(panel=>{

const rect = panel.getBoundingClientRect();

const center = window.innerWidth/2;

const panelCenter = rect.left + rect.width/2;

const distance = panelCenter-center;



const move = distance*.06;

const scale = 1-Math.abs(distance)/5000;

const opacity = Math.max(.15,1-Math.abs(distance)/700);



panel.style.transform = `translateX(${-move}px) scale(${scale})`;

panel.style.opacity = opacity;

});

heroTime += 0.02;

const floatY = Math.sin(heroTime) * 10;

const glow = 25 + Math.sin(heroTime * 2) * 15;

hero.style.transform = `
translateY(${floatY}px)
scale(1)
`;

hero.style.textShadow = `
0 0 ${glow}px rgba(125,215,255,.35),
0 0 ${glow*2}px rgba(125,215,255,.12)
`;

renderer.render(scene,camera);

}

animate();



// -----------------------------

window.addEventListener("resize",()=>{

renderer.setSize(

window.innerWidth,

window.innerHeight

);

camera.aspect =

window.innerWidth/window.innerHeight;

camera.updateProjectionMatrix();

});
