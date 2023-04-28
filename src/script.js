import "./style.css";
import * as dat from "lil-gui";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { gsap } from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Chart from "chart.js/auto";
import firefliesVertexShader from "./shaders/fireflies/vertex.glsl";
import firefliesFragmentShader from "./shaders/fireflies/fragment.glsl";

let sceneReady = false;
let animationsReady = false;

const havePointerLock = (
    'pointerLockElement' in document ||
    'mozPointerLockElement' in document ||
    'webkitPointerLockElement' in document
);

if (havePointerLock) {
    const element = document.body;
    const instructions = document.querySelector('#instructions');

    const pointerlockchange = () => {
        if (
            document.pointerLockElement === element ||
            document.mozPointerLockElement === element ||
            document.webkitPointerLockElement === element
        ) {
            controls.enabled = true;
        } else {
            controls.enabled = false;
            instructions.style.display = '';
        }
    };

    const pointerlockerror = () => {
        instructions.style.display = '';
    };

    // Hook pointer lock state change events
    document.addEventListener('pointerlockchange', pointerlockchange);
    document.addEventListener('mozpointerlockchange', pointerlockchange);
    document.addEventListener('webkitpointerlockchange', pointerlockchange);

    document.addEventListener('pointerlockerror', pointerlockerror);
    document.addEventListener('mozpointerlockerror', pointerlockerror);
    document.addEventListener('webkitpointerlockerror', pointerlockerror);

    instructions.addEventListener('click', () => {
        instructions.style.display = 'none';
        element.requestPointerLock = (
            element.requestPointerLock ||
            element.mozRequestPointerLock ||
            element.webkitRequestPointerLock
        );

        if (/Firefox/i.test(navigator.userAgent)) {
            const fullscreenchange = () => {
                if (
                    document.fullscreenElement === element ||
                    document.mozFullscreenElement === element ||
                    document.mozFullScreenElement === element
                ) {
                    document.removeEventListener('fullscreenchange', fullscreenchange);
                    document.removeEventListener('mozfullscreenchange', fullscreenchange);
                    element.requestPointerLock();
                }
            };

            document.addEventListener('fullscreenchange', fullscreenchange);
            document.addEventListener('mozfullscreenchange', fullscreenchange);
            element.requestFullscreen = (
                element.requestFullscreen ||
                element.mozRequestFullscreen ||
                element.mozRequestFullScreen ||
                element.webkitRequestFullscreen
            );
            element.requestFullscreen();
        } else {
            element.requestPointerLock();
        }
    });
} else {
    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}

const loadingBarElement = document.querySelector(".loading-bar");
const loadingManager = new THREE.LoadingManager(
    // Loaded
    () => {
        // Wait a little
        window.setTimeout(() => {
            // Animate overlay
            gsap.to(overlayMaterial.uniforms.uAlpha, {
                duration: 0.1,
                value: 0,
                delay: 1,
            });

            // Update loadingBarElement
            loadingBarElement.classList.add("ended");
            loadingBarElement.style.transform = "";

            // sceneReady = true;
            animationsReady = true;
        }, 500);
    },

    // Progress
    (itemUrl, itemsLoaded, itemsTotal) => {
        // Calculate the progress and update the loadingBarElement
        const progressRatio = itemsLoaded / itemsTotal;
        loadingBarElement.style.transform = `scaleX(${progressRatio})`;
    }
);


/**
 * Base
 */

// Debug
const debugObject = {};
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();


/**
 * Fireflies
 */
// Geometry
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 30
const positionArray = new Float32Array(firefliesCount * 3)
const scaleArray = new Float32Array(firefliesCount)

for (let i = 0; i < firefliesCount; i++) {
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4
    positionArray[i * 3 + 1] = Math.random() * 1.5
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4

    scaleArray[i] = Math.random()
}

firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))

// Material
const firefliesMaterial = new THREE.ShaderMaterial({
    uniforms:
    {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 100 }
    },
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
})

gui.add(firefliesMaterial.uniforms.uSize, 'value').min(0).max(5000).step(1).name('firefliesSize')


// Points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
scene.add(fireflies)


/**
 * Loaders
 */

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

// GLTF loader
const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setDRACOLoader(dracoLoader);

// camera
const camera = new THREE.PerspectiveCamera(
    23,
    window.innerWidth / window.innerHeight,
    .5,
    500
);
const fovControl = gui.add(camera, 'fov', 1, 180).name('FOV');

fovControl.onChange(() => {
    camera.updateProjectionMatrix();
});

scene.add(camera);

// intro overlay
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
const overlayMaterial = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
        uAlpha: { value: 1 },
    },
    vertexShader: `
        void main()
        {
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uAlpha;

        void main()
        {
            gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
        }
    `,
});
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
scene.add(overlay);


const textureLoader = new THREE.TextureLoader(loadingManager);


// Helper function to create a material with the given texture
function createMaterial(textureName) {
    const texture = textureLoader.load(textureName);
    texture.flipY = false;
    return new THREE.MeshBasicMaterial({ map: texture });
}
// Model
let cameraMixer = null;

gltfLoader.load("baking5.glb", (gltf) => {


    const objectMaterials = new Map([['Cube504', createMaterial("baked.jpg")],
    ['ALGO', createMaterial("ALGO.jpg")],
    ['Plane229', createMaterial("green.jpg")],
    ['Plane056', createMaterial("window.jpg")],
    ['Cylinder012', createMaterial("trees.jpg")],
    ['Cube285', createMaterial("randome.jpg")],
    ['Cube014', createMaterial("A.jpg")],
    ['Cube028', createMaterial("dirt.jpg")],
    ['Cube145', createMaterial("cs.jpg")],
    ['Cube005', createMaterial("car.jpg")]
    ]);

    gltf.scene.traverse((child) => {
        const objectMaterial = objectMaterials.get(child.name);
        if (objectMaterial) {
            child.traverse((child) => {
                child.material = objectMaterial;
            });
        }
    });


    gltf.scene.scale.set(10, 10, 10);
    scene.add(gltf.scene);
    console.log(gltf.animations);


});


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

});

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,

});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
debugObject.clearColor = "#000000";
gui.addColor(debugObject, 'clearColor').onChange(() => {
    renderer.setClearColor(debugObject.clearColor)
})
renderer.setClearColor(debugObject.clearColor);

camera.position.set(-3.3360582631181206, 3.277317753766088, -17.49707990429836);
camera.rotation.set(-2.8081273987457633, 0.009255851290419384, 3.138386471491446);
debugObject.walkingSpeed = 0.3;

const controls = new PointerLockControls(camera, document.body);
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

document.addEventListener("keydown", function (event) {
    switch (event.code) {
        case "KeyW":
            moveForward = true;
            break;
        case "KeyA":
            moveLeft = true;
            break;
        case "KeyS":
            moveBackward = true;
            break;
        case "KeyD":
            moveRight = true;
            break;
    }
});

document.addEventListener("keyup", function (event) {
    switch (event.code) {
        case "KeyW":
            moveForward = false;
            break;
        case "KeyA":
            moveLeft = false;
            break;
        case "KeyS":
            moveBackward = false;
            break;
        case "KeyD":
            moveRight = false;
            break;
    }
});





const raycaster = new THREE.Raycaster();
const points = [
    {
        position: new THREE.Vector3(3.04, 1.32, 3.36),
        element: document.querySelector(".point-0"),
        visible: true,
    },
    {
        position: new THREE.Vector3(20.25, 4.2, 8.08),
        element: document.querySelector(".point-1"),
        visible: true,
    },
    {
        position: new THREE.Vector3(-7.78, 3.29, 5.75),
        element: document.querySelector(".point-2"),
        visible: true,
    },
    {
        position: new THREE.Vector3(4.52, 8.21, 0.39),
        element: document.querySelector(".point-3"),
        visible: true,
    },
    {
        position: new THREE.Vector3(-2.85, 9.44, 0.84),
        element: document.querySelector(".point-4"),
        visible: false,
    },
    {
        position: new THREE.Vector3(3.29, 21.73, 0.84),
        element: document.querySelector(".point-5"),
        visible: false,
    },
];

// gui visiblity
const pointFolder = gui.addFolder('points');
points.forEach((point, index) => {
    pointFolder.add(point, "visible").name("visible").onChange(() => {
        if (!point.visible) {
            point.element.classList.remove("visible");
        }
    });
});



// add gui controles for the position above
points.forEach((point, index) => {
    const pointFolder = gui.addFolder(`point ${index}`);
    pointFolder
        .add(point.position, "x")
        .min(-50)
        .max(50)
        .step(0.01)
        .name("point x");
    pointFolder
        .add(point.position, "y")
        .min(-50)
        .max(50)
        .step(0.01)
        .name("point y");
    pointFolder
        .add(point.position, "z")
        .min(-50)
        .max(50)
        .step(0.01)
        .name("point z");
});



window.addEventListener("dblclick", () => {
    sceneReady = true;
});

// walking speed controles
window.addEventListener("wheel", (event) => {
    if (event.deltaY < 0) {
        debugObject.walkingSpeed += 0.01;
    } else {
        debugObject.walkingSpeed = Math.max(debugObject.walkingSpeed - 0.01, 0);
    }
});



// Chart 1
const ctx = document.getElementById("myChart");
const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                color: "white",
            },
        },
        x: {
            ticks: {
                color: "white",
            },
        },
    },
    plugins: {
        title: {
            display: true,
            text: "Male/Female Chart",
            color: "white",
        },
        legend: {
            labels: {
                color: "white",
            },
        },
        tooltip: {
            backgroundColor: "black",
        },
        datalabels: {
            color: "black",
        },
    },
};

const femaleCount = 26000;
const maleCount = 22000;

const chart = new Chart(ctx, {
    type: "bar",
    data: {
        labels: ["Male", "Female"],
        datasets: [
            {
                label: "male/female",
                data: [maleCount, femaleCount],
                backgroundColor: ["rgb(54, 162, 235)", "rgb(255, 99, 132)"],
                borderWidth: 1,
            },
        ],
    },
    options: options,
});

// Set chart container size using CSS
chart.canvas.parentNode.style.width = "230px";
chart.canvas.parentNode.style.height = "180px";

// Chart 2
const data = {
    labels: ["Year 1", "Year 2", "Year 3", "Year 4"],
    datasets: [
        {
            data: [12000, 13000, 14000, 9000],
            backgroundColor: [
                "rgb(255, 99, 132)",
                "rgb(75, 192, 192)",
                "rgb(54, 162, 235)",
                "rgb(255, 205, 86)",
            ],
            hoverOffset: 4,
        },
    ],
};

const config = {
    type: "doughnut",
    data: data,
    options: {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: "Student Year Distribution",
            },
            legend: {
                position: "bottom",
                labels: {
                    boxWidth: 15,
                    padding: 20,
                },
            },
        },
    },
};

const ctx2 = document.getElementById("myChart2").getContext("2d");
const chart2 = new Chart(ctx2, config);

// Set chart container size using CSS
chart2.canvas.parentNode.style.width = "200px";
chart2.canvas.parentNode.style.height = "200px";

// Chart 3
const ctx3 = document.getElementById("myChart3");
const sundayCount = 2000;
const mondayCount = 3500;
const tuesdayCount = -2800;
const wednesdayCount = 4200;
const thursdayCount = 3900;

const chart3 = new Chart(ctx3, {
    type: "bar",
    data: {
        labels: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        datasets: [
            {
                label: "Student Density",
                data: [sundayCount, mondayCount, tuesdayCount, wednesdayCount, thursdayCount],
                backgroundColor: [
                    " rgba(255, 99, 132, 1)",
                    "rgba(54, 162, 235, 1)",
                    "rgba(255, 206, 86, 1) ",
                    " rgba(75, 192, 192, 1)",
                    "rgba(153, 102, 255, 1)",
                ],
                borderColor: [
                    "rgba(255, 99, 132, 0.2)",
                    "rgba(54, 162, 235, 0.2)",
                    "rgba(255, 206, 86, 0.2)",
                    "rgba(75, 192, 192, 0.2)",
                    " rgba(153, 102, 255, 0.2)",
                ],
                borderWidth: 1,
            },
        ],
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 500,
                },
            },
        },
        plugins: {
            title: {
                display: true,
                text: "Student Density by Day",
            },
            legend: {
                display: false,
            },
        },
    },
});

// Set chart container size using CSS
chart3.canvas.parentNode.style.width = "400px";
chart3.canvas.parentNode.style.height = "400px";


// camera gsap animation
const cameraTweens = [
    {
        name: "Tween Camera",
        position: new THREE.Vector3(-3.2483701758623527, 13.634168551463912, -46.812826651518506),
        rotation: new THREE.Euler(-3.0221365120661337, -0.04931166441399463, -3.135676359942443, "XYZ")
    },
    {
        name: "Tween Camera to Car",
        position: new THREE.Vector3(-23.159590228823392, 0.5609239970941227, 2.693002726644136),
        rotation: new THREE.Euler(-0.6943327446859502, -1.722623874254577, 0.033612252107971, "XYZ")
    },
    {
        name: "Tween Camera building",
        position: new THREE.Vector3(59.97462923030914, 7.9301704228760785, 12.65022837169855),
        rotation: new THREE.Euler(-0.6943327446859502, -1.722623874254577, 0.033612252107971, "XYZ")
    }
];

const duration = 1;
const easing = "power2.inOut";

function tweenCameraToPosition(position, rotation) {
    gsap.to(camera.position, duration, {
        x: position.x,
        y: position.y,
        z: position.z,
        ease: easing,
    });
    gsap.to(camera.rotation, duration, {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
        ease: easing,
    });
}

cameraTweens.forEach(tween => {
    const button = {
        trigger: function () {
            tweenCameraToPosition(tween.position, tween.rotation);
        },
    };
    gui.add(button, "trigger").name(tween.name);
});

const positionButton = {
    trigger: function () {
        // Log the camera position and rotation to the console
        console.log(camera.position);
        console.log(camera.rotation);
    },
};
gui.add(positionButton, "trigger").name("log pos");


// controls
let orbit
const orbitButton = {
    trigger: function () {
        // dispose of the PointerLockControls instance
        controls.dispose();
        // create the OrbitControls instance
        orbit = new OrbitControls(camera, renderer.domElement);
        orbit.enableDamping = true;
    },
};

gui.add(orbitButton, 'trigger').name('Orbit Controls');



// tick function

const clock = new THREE.Clock();
let oldElapsedTime = 0;

const tick = () => {
    // Calculate elapsed time and delta time
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;


    // Update fireflies
    firefliesMaterial.uniforms.uTime.value = elapsedTime;

    // Update controls if locked
    if (controls.isLocked === true) {
        const velocity = new THREE.Vector3();
        const direction = new THREE.Vector3();

        const frontVector = new THREE.Vector3(0, 0, -1);
        const sideVector = new THREE.Vector3(-1, 0, 0);

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward)
            velocity.add(frontVector.multiplyScalar(-direction.z));
        if (moveLeft || moveRight)
            velocity.add(sideVector.multiplyScalar(-direction.x));

        controls.moveForward(velocity.z * debugObject.walkingSpeed);
        controls.moveRight(velocity.x * debugObject.walkingSpeed);
    }

    // Update orbit controls
    if (orbit) {
        orbit.update();
    }

    // Update animations
    if (cameraMixer && animationsReady) {
        cameraMixer.update(deltaTime);
    }

    // Render scene
    renderer.render(scene, camera);


    // Update points
    if (sceneReady) {
        for (const point of points) {
            if (point.visible) {
                // Get screen position
                const screenPosition = point.position.clone().project(camera);

                // Set raycaster
                raycaster.setFromCamera(screenPosition, camera);
                const intersects = raycaster.intersectObjects(scene.children, true);

                // Show or hide point based on raycaster intersection
                if (intersects.length === 0) {
                    point.element.classList.add("visible");
                } else {
                    const intersectionDistance = intersects[0].distance;
                    const pointDistance = point.position.distanceTo(camera.position);

                    if (intersectionDistance < pointDistance) {
                        point.element.classList.remove("visible");
                    } else {
                        point.element.classList.add("visible");
                    }
                }

                // Set point position
                const translateX = screenPosition.x * sizes.width * 0.5;
                const translateY = -screenPosition.y * sizes.height * 0.5;
                point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`;
            }
        }
    }


    // Request next animation frame
    window.requestAnimationFrame(tick);
};

tick();

