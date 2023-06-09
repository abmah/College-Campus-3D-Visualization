import "./style.css";
import * as dat from "lil-gui";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { gsap } from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Chart from "chart.js/auto";



// menu logic

const menu = document.getElementById('menu')
const menuButton = document.getElementById('menu-toggle')
const orbitMenuOption = document.getElementById('orbit')
const pointerlockMenuOption = document.getElementById('pointerlock')
const assistantMenuOption = document.getElementById('assistant')
const tourMenuOption = document.getElementById('tour')



menuButton.addEventListener("click", () => {
    menu.classList.toggle("visible");
});

orbitMenuOption.addEventListener("click", () => {
    menu.classList.toggle("visible");
    changeControls()
});

pointerlockMenuOption.addEventListener("click", () => {
    menu.classList.toggle("visible");
    activatePointerLock()
});





// chat bot ai
let chat_icon = document.querySelector(".chat-bot-icon");
let chat_box = document.querySelector(".chat-bot-box");


const chatLog = document.querySelector("#chat-log");

// Initialize the WebSocket connection
const socket = new WebSocket("ws://localhost:8080");

// Handle incoming messages from the server
socket.addEventListener("message", event => {

    chatLog.scrollTop = chatLog.scrollHeight - chatLog.clientHeight;
    chatLog.lastElementChild.scrollIntoView({ behavior: "smooth" });

    const message = JSON.parse(event.data);
    console.log(message);

    const li = document.createElement("li");
    li.classList.add('other-message');
    chatLog.appendChild(li);

    // Set up typewriter effect
    const text = message.answer;
    let index = 0;
    const speed = 10; // Adjust typing speed here

    function typeWriter() {
        if (index < text.length) {
            li.innerHTML += text.charAt(index);
            index++;
            setTimeout(typeWriter, speed);
        }
        chatLog.scrollTop = chatLog.scrollHeight - chatLog.clientHeight;
        chatLog.lastElementChild.scrollIntoView({ behavior: "smooth" });

    }

    typeWriter();

    chatLog.scrollTop = chatLog.scrollHeight - chatLog.clientHeight;
    chatLog.lastElementChild.scrollIntoView({ behavior: "smooth" });

    points.forEach((point) => {
        point.visible = false;
        point.element.classList.remove("visible");
    })


    if (message.position && message.intent !== 'hasan.area') {

        const tweenPos = new THREE.Vector3(message.position[0], message.position[1], message.position[2])
        tweenCameraToPosition(tweenPos, 2)

        setTimeout(() => {
            sceneReady = true;
            // points[6].visible = true
            // points[6].position.set(message.position[0], message.position[1], message.position[2])
        }, 1500);

    }




    if (message.schedule) {
        const schedule = message.schedule;

        for (let i = 0; i < schedule.length; i++) {
            const item = schedule[i];
            const position = new THREE.Vector3(item.position[0], item.position[1], item.position[2]);
            const duration = 1; // 2 seconds duration

            const cameraOffset = new THREE.Vector3(0, 1, 3); // Adjust the camera offset as per your requirement

            setTimeout(() => {
                var element = document.createElement('div');
                element.classList.add('point'); // Add class 'point' to the outer element

                var labelElement = document.createElement('div');
                labelElement.classList.add('label');
                labelElement.classList.add('label-text');
                labelElement.textContent = item.class; // Replace with the desired label text
                element.appendChild(labelElement); // Append the label element to the outer element

                var textElement = document.createElement('div');
                textElement.classList.add('text');
                textElement.innerHTML = `${item.time}<br>${item.location}<br>${item.instructor}`; // Replace with the desired text structure
                element.appendChild(textElement); // Append the text element to the outer element

                var container = document.querySelector('.container'); // Select the container element using class name
                container.appendChild(element); // Append the element to the container

                // Append the element to the points array
                points.push({
                    position: position, // Replace with the desired position
                    element: element,
                    visible: true, // Replace with the desired visibility
                });

                // Calculate the position with the camera offset
                const tweenPosition = position.clone().add(cameraOffset);

                // Call the tweening function with the adjusted position and duration
                // tweenCameraToPosition(tweenPosition, duration);
            }, (i + 1) * 1000); // Delay each iteration by (i + 1) seconds
        }
    }

    if (message.intent === 'hasan.area') {
        const areaGeometry = new THREE.BoxGeometry(5, 5, 5);
        const areaWireFrame = new THREE.LineSegments(
            new THREE.EdgesGeometry(areaGeometry),
            new THREE.LineBasicMaterial({ color: 0xff0000 })
        );

        areaWireFrame.position.set(message.position[0], message.position[1], message.position[2]);
        areaWireFrame.rotation.x = -Math.PI / 2;

        scene.add(areaWireFrame);
    }


    if (message.intent === 'chart.FMR') {
        makeFMChart()
        points[3].visible = true
    }

    if (message.intent === 'chart.SY') {
        makeSYChart()
        points[4].visible = true
    }

    if (message.intent === 'chart.SD') {

        makeSDChart()
        points[5].visible = true
    }



});




// Send messages to the server when the user presses Enter
const input = document.querySelector("#chat-input");
input.addEventListener("keydown", event => {
    if (event.key === "Enter" && input.value != '') {
        const message = input.value;
        input.value = "";

        // Send the message to the server
        socket.send(message);

        // Add the message to the chat log

        const li = document.createElement("li");
        li.classList.add("sent");
        li.textContent = message;
        li.classList.add(
            'self-message'
        )
        chatLog.appendChild(li);
    }
});


// end chat bot ai

chat_icon.addEventListener("click", () => {
    chat_box.classList.toggle("active");
});


// init
let sceneReady = true;
let animationsReady = false;

const havePointerLock = (
    'pointerLockElement' in document ||
    'mozPointerLockElement' in document ||
    'webkitPointerLockElement' in document
);

if (havePointerLock) {
    const element = document.body;
    const instructions = document.querySelector('#pointerlock');

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
            changeControls()
            tweenCameraToPosition(cameraTweens[3].position, 5)


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
    0.5,
    500
);



// FOV control
const fovControl = gui.add(camera, 'fov', 1, 180).name('FOV');
fovControl.onChange(() => {
    camera.updateProjectionMatrix();
});

// Near and far controls
const cameraParams = {
    near: 0.5,
    far: 500
};

gui.add(cameraParams, 'near', 0.1, 100).onChange(updateCamera);
gui.add(cameraParams, 'far', 100, 1000).onChange(updateCamera);

function updateCamera() {
    camera.near = cameraParams.near;
    camera.far = cameraParams.far;
    camera.updateProjectionMatrix();
}

// Camera position control
gui.add(camera.position, 'y', -10, 10, 0.01).name('Camera Y');

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

gltfLoader.load("baked2.glb", (gltf) => {


    const objectMaterials = new Map([
        ['Cube003', createMaterial("Ground_desert_updated.jpg")],
        ['Cylinder012', createMaterial("Treees_updated.jpg")],
        ['Cube028', createMaterial('Ground_updated.jpg')],
        ['Cube002', createMaterial('Labotories.jpg')],
        ['Cube', createMaterial('Utilities.jpg')],
        ['Plane005', createMaterial('MainBuilding.jpg')],
        ['Plane056', createMaterial('Windows.jpg')],
        ['Plane004', createMaterial('Algorithim_building.jpg')],
        ['Cube005', createMaterial('BusCar.jpg')],
        ['Plane003', createMaterial('Theatre1.jpg')],
        ['Plane006', createMaterial('Chairs3.jpg')],

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
    // console.log(gltf.animations);


});


// Light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.camera.top = 2;
directionalLight.shadow.camera.right = 2;
directionalLight.shadow.camera.bottom = -2;
directionalLight.shadow.camera.left = -2;
directionalLight.shadow.mapSize.set(1024, 1024);
// adjust near and far planes for shadow camera
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;


scene.add(directionalLight);


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
debugObject.clearColor = "#0a0a0a";
gui.addColor(debugObject, 'clearColor').onChange(() => {
    renderer.setClearColor(debugObject.clearColor)
})
renderer.setClearColor(debugObject.clearColor);

// pointer lock controls
debugObject.walkingSpeed = 0.3;

gui.add(debugObject, 'walkingSpeed', 0.1, 1, 0.01);

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
        visible: false,
    },
    {
        position: new THREE.Vector3(20.25, 4.2, 8.08),
        element: document.querySelector(".point-1"),
        visible: false,
    },
    {
        position: new THREE.Vector3(-7.78, 3.29, 5.75),
        element: document.querySelector(".point-2"),
        visible: false,
    },
    {
        position: new THREE.Vector3(4.52, 8.21, 0.39),
        element: document.querySelector(".point-3"),
        visible: false,
    },
    {
        position: new THREE.Vector3(-2.85, 9.44, 0.84),
        element: document.querySelector(".point-4"),
        visible: false,
    },
    {
        position: new THREE.Vector3(3.29, 9.29, 0.84),
        element: document.querySelector(".point-5"),
        visible: false,
    },
    {
        position: new THREE.Vector3(-8.52, 1.76, 2.67),
        element: document.querySelector(".location-point"),
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

let chartReady = true


function makeFMChart() {
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
}



function makeSYChart() {
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

}

function makeSDChart() {

    // Chart 3
    const ctx3 = document.getElementById("myChart3");
    const sundayCount = 11000;
    const mondayCount = 6000;
    const tuesdayCount = 13000;
    const wednesdayCount = 5400;
    const thursdayCount = 12100;

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


}




// Area wire frame 2

const areaGeometry2 = new THREE.BoxGeometry(1, 1, 5);
const areaWireFrame2 = new THREE.LineSegments(
    new THREE.EdgesGeometry(areaGeometry2),
    new THREE.LineBasicMaterial({
        color: 0xff0000,

    })
);

areaWireFrame2.position.set(6.5, 2.4, -2.5);
areaWireFrame2.rotation.x = -Math.PI / 2;

// scene.add(areaWireFrame2);





// camera gsap animation
const cameraTweens = [
    {
        name: "Tween Camera",
        position: new THREE.Vector3(-3.2483701758623527, 13.634168551463912, -46.812826651518506),
        duration: 2
    },
    {
        name: "Tween Camera to Car",
        position: new THREE.Vector3(-23.159590228823392, 0.5609239970941227, 2.693002726644136),
        duration: 2
    },
    {
        name: "Tween Camera building",
        position: new THREE.Vector3(59.97462923030914, 7.9301704228760785, 12.65022837169855),
        duration: 2
    },
    {
        name: "intro camera tween",
        position: new THREE.Vector3(-1.353140659353707, 6.937502312233253, -30.519084253413453),
        duration: 2
    },
    {
        name: "Library Tween",
        position: new THREE.Vector3(-18.61092832326364, 4.243537490073049, 6.1420792672884055),
        duration: 1
    },

    {
        name: "Algorithim Tween",
        position: new THREE.Vector3(6.6717914920234165, 3.8548031304868884, 2.0047405176169804),
        duration: 1
    },
    {
        name: "Dr Hasan Tween",
        position: new THREE.Vector3(-16.97268408727934, 20.522256250825055, -20.432169910383895),
        duration: 1
    },
    {
        name: "cafeteria tween",
        position: new THREE.Vector3(19.583985610418956, 3.514349917370587, 5.57151503401632),
        duration: 1
    },
    {
        name: "theater tween",
        position: new THREE.Vector3(-13.847515541172456, 0.5076778402488984, 4.925996609927153),
        duration: 1
    }

];

const easingTypes = [
    "power0",
    "power1",
    "power2",
    "power3",
    "power4",
    "linear",
    "none",
    "rough",
    "slow",
    "stepped"
];

let currentEasingType = easingTypes[2];



function tweenCameraToPosition(position, duration) {
    gsap.to(camera.position, duration, {
        x: position.x,
        y: position.y,
        z: position.z,
        ease: currentEasingType,
    });

}

cameraTweens.forEach(tween => {
    const button = {
        trigger: function () {
            tweenCameraToPosition(tween.position, tween.duration);
        },
    };
    gui.add(button, "trigger").name(tween.name);
});

const positionButton = {
    trigger: function () {
        console.log(camera.position.x, camera.position.y, camera.position.z)
        console.log(camera.rotation.x, camera.rotation.y, camera.rotation.z)

    },
};
gui.add(positionButton, "trigger").name("log pos");

gui.add({ easingType: currentEasingType }, "easingType", easingTypes).onChange(value => {
    currentEasingType = value;
});

// controls
let currentControls = null; // to keep track of the current control instance
let orbit = false;
const orbitButton = {
    trigger: function () {
        // dispose of the current control instance
        changeControls()
    },
};

function changeControls() {
    if (currentControls) {
        currentControls.dispose();
    }
    // create the OrbitControls instance
    currentControls = new OrbitControls(camera, renderer.domElement);

    orbit = true;
    currentControls.enableDamping = true;
    // currentControls.minDistance = 20;
    currentControls.maxDistance = 90;
    camera.near = 1
    camera.fov = 25;
    camera.updateProjectionMatrix();

}

function activatePointerLock() {
    // dispose of the current control instance
    if (currentControls) {
        currentControls.dispose();
    }
    // create the PointerLockControls instance
    orbit = false;
    currentControls = new PointerLockControls(camera, document.body);
    camera.fov = 50;
    camera.near = 0.1
    camera.updateProjectionMatrix();
}

const pointerLockButton = {
    trigger: activatePointerLock,
};
gui.add(orbitButton, 'trigger').name('Orbit Controls');
gui.add(pointerLockButton, 'trigger').name('Pointer Lock Controls');


// camera positioning
camera.position.set(.87, 51, -97);


// tick function

const clock = new THREE.Clock();
let oldElapsedTime = 0;

gui.close();



// camera space bar rise 

const elevationIncrement = 0.02;

// Flag variables to indicate if specific keys are pressed
let spaceBarPressed = false;
let shiftKeyPressed = false;

// Event listener to listen for the keydown and keyup events
window.addEventListener('keydown', function (event) {
    if (event.code === 'Space') {
        spaceBarPressed = true;
    } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        shiftKeyPressed = true;
    }
});

window.addEventListener('keyup', function (event) {
    if (event.code === 'Space') {
        spaceBarPressed = false;
    } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        shiftKeyPressed = false;
    }
});

const tick = () => {
    // Calculate elapsed time and delta time
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;

    // camera space bar rise

    if (!orbit) {

        if (spaceBarPressed) {
            camera.position.y += elevationIncrement;
        }

        // If shift key is pressed, move the camera down
        if (shiftKeyPressed) {
            camera.position.y -= elevationIncrement;
        }
    }

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
        currentControls.update();
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

