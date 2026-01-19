import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// Scene Setup
const scene = new THREE.Scene();
// scene.background iptal edildi -> CSS Background görünecek
// scene.fog iptal edildi -> Arkaplan fotoğrafı net görünsün

// Camera
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(4, 2.5, 5); // Slightly closer, better angle

// Renderer
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const container = document.getElementById('canvas-container');
container.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2;
controls.maxDistance = 15;
controls.target.set(0, 1, 0);
controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent going below ground
controls.autoRotate = false; // Kullanıcı isteğiyle kapatıldı
controls.autoRotateSpeed = 0.5;

// Lighting Setup - FULL COVERAGE (Kör Nokta Yok)

// 1. Güçlü Ortam Işığı (Temel aydınlık)
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

// 2. Yarım Küre Işığı (Genel dolgu)
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xeef2ff, 0.8);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

// 3. Ana Işık (Ön - Gölge veren)
// Yükseklik artırıldı (Y=20) -> Gölge kısaldı
// Z azaltıldı (Z=5) -> Gölge altına girdi
const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
mainLight.position.set(2, 20, 10);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
// Blur radius artırıldı (Soft shadow)
mainLight.shadow.radius = 8;
mainLight.shadow.bias = -0.0001;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 50;
mainLight.shadow.camera.left = -15;
mainLight.shadow.camera.right = 15;
mainLight.shadow.camera.top = 15;
mainLight.shadow.camera.bottom = -15;
scene.add(mainLight);

// 4. Dolgu Işıklar (Her yönden vursun)
const leftLight = new THREE.DirectionalLight(0xffffff, 0.8);
leftLight.position.set(-10, 5, 5);
scene.add(leftLight);

const rightLight = new THREE.DirectionalLight(0xffffff, 0.8);
rightLight.position.set(10, 5, 5);
scene.add(rightLight);

const topLight = new THREE.DirectionalLight(0xffffff, 1.0);
topLight.position.set(0, 15, 0);
scene.add(topLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
backLight.position.set(0, 5, -10);
scene.add(backLight);

// --- 3D ROOM CONSTRUCTION ---

// Materials
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfb997, // Warm Oak Wood
    roughness: 0.8,
    metalness: 0.1
});

const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0ece6, // Cream White
    roughness: 0.9,
    metalness: 0.0
});

// Room Dimensions - More realistic bedroom scale relative to cabinet (~2m)
const roomWidth = 12;  // Was 40
const roomDepth = 10;  // Was 30
const wallHeight = 5;  // Was 15

// 1. Floor (Zemin)
const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// 2. Back Wall (Arka Duvar)
const backWallGeometry = new THREE.PlaneGeometry(roomWidth, wallHeight);
const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
backWall.position.set(0, wallHeight / 2, -roomDepth / 2);
backWall.receiveShadow = true;
scene.add(backWall);

// 3. Side Walls (Yan Duvarlar)
const sideWallGeometry = new THREE.PlaneGeometry(roomDepth, wallHeight);

// Left Wall
const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.set(-roomWidth / 2, wallHeight / 2, 0);
leftWall.receiveShadow = true;
scene.add(leftWall);

// Right Wall
const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.set(roomWidth / 2, wallHeight / 2, 0);
rightWall.receiveShadow = true;
scene.add(rightWall);

// 4. Baseboards (Süpürgelikler) - Detay için
const baseboardMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const baseHeight = 0.8;
const baseDepth = 0.2;

// Back Baseboard
const backBaseG = new THREE.BoxGeometry(roomWidth, baseHeight, baseDepth);
const backBase = new THREE.Mesh(backBaseG, baseboardMaterial);
backBase.position.set(0, baseHeight / 2, -roomDepth / 2 + baseDepth / 2);
scene.add(backBase);

// Left Baseboard
const sideBaseG = new THREE.BoxGeometry(baseDepth, baseHeight, roomDepth);
const leftBase = new THREE.Mesh(sideBaseG, baseboardMaterial);
leftBase.position.set(-roomWidth / 2 + baseDepth / 2, baseHeight / 2, 0);
scene.add(leftBase);

// Right Baseboard
const rightBase = new THREE.Mesh(sideBaseG, baseboardMaterial);
rightBase.position.set(roomWidth / 2 - baseDepth / 2, baseHeight / 2, 0);
scene.add(rightBase);

// --- END ROOM ---

// No GridHelper needed for store look

// DRACO Loader Setup
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');

// GLTF Loader
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// Door Management
const doors = [];
const doorData = []; // Temporary storage during loading
const doorStates = new Map(); // true = open, false = closed
const doorOriginalX = new Map(); // Store original X positions

// Drawer Management
const drawers = [];
const drawerData = []; // Temporary storage during loading
const drawerStates = new Map(); // true = open, false = closed
const drawerOriginalZ = new Map(); // Store original Z positions
const drawerOriginalX = new Map(); // Store original X positions for top drawers

let modelRef = null;
let modelOffset = new THREE.Vector3();

// Raycaster for click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');

// Load Model
const loadingScreen = document.getElementById('loading-screen');
const loadingProgress = document.getElementById('loading-progress');

loader.load(
    './Dolap.glb',
    (gltf) => {
        const model = gltf.scene;
        modelRef = model;

        // Log all mesh names for debugging
        console.log('📋 Model içindeki tüm mesh\'ler:');
        const potentialDoors = [];
        const foundDoorParents = new Set(); // Track unique parent groups
        const foundDrawerParents = new Set(); // Track unique drawer groups

        model.traverse((child) => {
            if (child.isMesh) {
                console.log(`  - "${child.name}" (parent: ${child.parent?.name || 'none'})`);
                child.castShadow = true;
                child.receiveShadow = true;

                // Improve material quality
                if (child.material) {
                    child.material.envMapIntensity = 1;
                }

                // Detect sliding doors by checking if PARENT name matches
                // Box2449 = Sol kapak, Box2448 = Orta kapak, Box2442 = Sağ kapak
                const doorNames = ['Box2449', 'Box2448', 'Box2442'];
                const parentName = child.parent?.name || '';

                // Check if parent is a door group
                const matchedDoor = doorNames.find(dn => parentName === dn);

                if (matchedDoor && !foundDoorParents.has(parentName)) {
                    // Store the PARENT group, not the mesh
                    const doorIndex = doorNames.indexOf(matchedDoor);
                    const parentGroup = child.parent;
                    doorData.push({ mesh: parentGroup, index: doorIndex, name: parentName });
                    foundDoorParents.add(parentName);
                    console.log(`  🚪 Kapak GRUBU bulundu: ${parentName} (index: ${doorIndex})`);
                }

                // Detect drawers by parent name
                // Kapak 1 arkası: Plane093 (üst)
                // Kapak 2 arkası: Box66787356, Box66787348, Rectangle010, Box66787350, Rectangle012
                const drawerNames = [
                    'Plane093',  // Kapak 1 arkası üst (index 0)
                    'Box66787356', 'Box66787348', 'Rectangle010', 'Box66787350', 'Rectangle012'  // Kapak 2 arkası
                ];

                const matchedDrawer = drawerNames.find(dn => parentName === dn);
                if (matchedDrawer && !foundDrawerParents.has(parentName)) {
                    const drawerIndex = drawerNames.indexOf(matchedDrawer);
                    const parentGroup = child.parent;
                    drawerData.push({ mesh: parentGroup, index: drawerIndex, name: parentName });
                    foundDrawerParents.add(parentName);
                    console.log(`  📦 Çekmece GRUBU bulundu: ${parentName} (index: ${drawerIndex})`);
                }

                // Also log if name contains "Box" for debugging
                if (child.name.toLowerCase().includes('box')) {
                    potentialDoors.push(child.name);
                }
            }
        });

        console.log('📦 Potansiyel kapak isimleri (Box içeren):', potentialDoors);
        console.log('🚪 Bulunan kapak grupları:', Array.from(foundDoorParents));
        console.log('📦 Bulunan çekmece grupları:', Array.from(foundDrawerParents));

        // Sort doors by index (left to right) and add to doors array
        doorData.sort((a, b) => a.index - b.index);
        doorData.forEach(d => {
            doors.push(d.mesh);
            doorStates.set(d.mesh.uuid, false);
            doorOriginalX.set(d.mesh.uuid, d.mesh.position.x);
            console.log(`  📍 Kapak ${d.name} orijinal X: ${d.mesh.position.x}`);
        });

        // Sort drawers by index and add to drawers array
        drawerData.sort((a, b) => a.index - b.index);
        drawerData.forEach(d => {
            drawers.push(d.mesh);
            drawerStates.set(d.mesh.uuid, false);
            drawerOriginalZ.set(d.mesh.uuid, d.mesh.position.z);
            drawerOriginalX.set(d.mesh.uuid, d.mesh.position.x);
            console.log(`  📍 Çekmece ${d.name} orijinal Z: ${d.mesh.position.z}, X: ${d.mesh.position.x}`);
        });

        // Center model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        modelOffset.set(-center.x, -box.min.y, -center.z);
        model.position.copy(modelOffset);

        // Adjust camera based on model size
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraDistance = maxDim / (2 * Math.tan(fov / 2)) * 1.1; // 1.5 -> 1.1 (Closer)

        // Mobile adjustment: Zoom out to fit width
        if (window.innerWidth < 768) {
            cameraDistance *= 1.4;
        }

        camera.position.set(cameraDistance, cameraDistance * 0.7, cameraDistance);
        controls.target.set(0, size.y / 2, 0);
        controls.update();

        scene.add(model);

        // Create door buttons
        createDoorButtons();

        // Hide loading screen
        loadingScreen.classList.add('hidden');

        console.log('✅ Model yüklendi! Bulunan kapak sayısı:', doors.length);
        console.log('📊 Model boyutları:', size);
        console.log('🚪 Kapaklar:', doors.map(d => d.name).join(', '));
    },
    (xhr) => {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        loadingProgress.textContent = percent + '%';
    },
    (error) => {
        console.error('❌ Model yüklenirken hata:', error);
        loadingProgress.textContent = 'Hata!';
    }
);

// Create door control buttons
function createDoorButtons() {
    const doorContainer = document.getElementById('door-buttons-container');
    doorContainer.innerHTML = '';

    if (doors.length === 0) {
        doorContainer.innerHTML = '<p style="opacity:0.6;font-size:12px;">Kapak bulunamadı</p>';
    } else {
        doors.forEach((door, index) => {
            const btn = document.createElement('button');
            btn.className = 'control-btn';
            btn.textContent = `Kapak ${index + 1}`;
            btn.dataset.doorIndex = index;
            btn.onclick = () => toggleDoor(index);
            doorContainer.appendChild(btn);
        });
    }

    const drawerWrapper = document.getElementById('drawer-container-wrapper');
    drawerWrapper.innerHTML = '';

    if (drawers.length > 0) {
        const title = document.createElement('div');
        title.className = 'section-title';
        title.textContent = 'Çekmece Kontrolleri';
        drawerWrapper.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'controls-grid';
        grid.id = 'drawer-buttons-container';
        drawerWrapper.appendChild(grid);

        drawers.forEach((drawer, index) => {
            const btn = document.createElement('button');
            btn.className = 'control-btn';
            btn.textContent = `Çekmece ${index + 1}`;
            btn.dataset.drawerIndex = index;
            btn.onclick = () => toggleDrawer(index);
            grid.appendChild(btn);
        });
    }
}

// Drawer to Door dependency map
// Çekmece Index: Kapak Index
// Çekmece 0 (Sol) -> Kapak 0 (Sol)
// Çekmece 1-5 (Sağ) -> Kapak 1 (Orta - Box2448)
const drawerToDoorMap = {
    0: 0,
    1: 1, 2: 1, 3: 1, 4: 1, 5: 1
};

// Toggle single door
function toggleDoor(index) {
    const door = doors[index];
    if (!door) return;

    const isOpen = doorStates.get(door.uuid);

    // Kapak kapanıyorsa, önce arkasındaki açık çekmeceleri kapat
    if (isOpen) {
        const dependentDrawers = [];
        Object.keys(drawerToDoorMap).forEach(drawerIdx => {
            if (drawerToDoorMap[drawerIdx] === index) {
                const dIndex = parseInt(drawerIdx);
                const drawer = drawers[dIndex];
                if (drawer && drawerStates.get(drawer.uuid)) {
                    dependentDrawers.push(dIndex);
                }
            }
        });

        if (dependentDrawers.length > 0) {
            console.log(`⚠️ Kapak ${index + 1} kapanıyor, önce ${dependentDrawers.length} çekmece kapatılıyor...`);
            // Açık çekmeceleri kapat
            dependentDrawers.forEach(dIdx => toggleDrawer(dIdx, true)); // true = force close without door check

            // Çekmeceler kapandıktan sonra kapağı kapat (biraz gecikmeli)
            setTimeout(() => proceedToggleDoor(index, door, isOpen), 800); // Çekmece animasyon süresi kadar bekle
            return;
        }
    }

    proceedToggleDoor(index, door, isOpen);
}

// Actual door toggle animation
function proceedToggleDoor(index, door, isOpen) {
    const originalX = doorOriginalX.get(door.uuid);
    const slideAmount = getSlidingAmount(door, index);

    // Sliding direction: 
    // Sol kapak (0) -> sola kayar (-X)
    // Orta kapak (1) -> sola kayar (-X) 
    // Sağ kapak (2) -> sağa kayar (+X)
    let direction;
    if (index === 0) direction = -1;      // Sol kapak sola
    else if (index === 1) direction = -1; // Orta kapak sola
    else direction = 1;                    // Sağ kapak sağa

    const targetX = isOpen ? originalX : originalX + (slideAmount * direction);

    gsap.to(door.position, {
        x: targetX,
        duration: 1.2,
        ease: 'power1.inOut',
        onComplete: () => {
            doorStates.set(door.uuid, !isOpen);
            updateButtonState(index, !isOpen);
        }
    });
}

// Calculate sliding amount based on door width
function getSlidingAmount(door, index) {
    const bbox = new THREE.Box3().setFromObject(door);
    const size = bbox.getSize(new THREE.Vector3());
    console.log(`📏 Kapak ${index} boyutları: x=${size.x.toFixed(3)}, y=${size.y.toFixed(3)}, z=${size.z.toFixed(3)}`);
    // Kapak genişliği z ekseninde olabilir (model orientasyonu)
    const doorWidth = Math.max(size.x, size.z);
    return doorWidth * 0.95;
}

// Toggle all doors
function toggleAllDoors() {
    const allClosed = Array.from(doorStates.values()).every(s => !s);

    doors.forEach((door, index) => {
        const currentState = doorStates.get(door.uuid);
        if (allClosed || currentState) {
            toggleDoor(index);
        }
    });
}

// Toggle single drawer (pull out on Z axis, except top drawers)
function toggleDrawer(index, forceClose = false) {
    const drawer = drawers[index];
    if (!drawer) return;

    const isOpen = drawerStates.get(drawer.uuid);

    // Eğer açılıyorsa (ve forceClose değilse), kapak kontrolü yap
    if (!isOpen && !forceClose) {
        const dependentDoorIndex = drawerToDoorMap[index];
        if (dependentDoorIndex !== undefined) {
            const door = doors[dependentDoorIndex];
            const isDoorOpen = doorStates.get(door.uuid);

            if (!isDoorOpen) {
                console.log(`⚠️ Çekmece ${index + 1} açılmak istendi ama Kapak ${dependentDoorIndex + 1} kapalı. Önce kapak açılıyor...`);
                toggleDoor(dependentDoorIndex);

                // Kapak açıldıktan sonra çekmeceyi aç (kapak süresi 1.2s, biraz erken başlatabiliriz akıcılık için)
                setTimeout(() => proceedToggleDrawer(index, drawer, isOpen), 900);
                return;
            }
        }
    }

    proceedToggleDrawer(index, drawer, isOpen);
}

// Actual drawer toggle animation
function proceedToggleDrawer(index, drawer, isOpen) {
    const pullAmount = getDrawerPullAmount(drawer, index);

    // Üstteki çekmeceler (Plane093, Box66787356) farklı yönde hareket ediyor
    // Index 0 = Plane093 (Kapak 1 arkası üst)
    // Index 1 = Box66787356 (Kapak 2 arkası üst - 2. çekmece silindiği için index 1 oldu)
    const isTopDrawer = (index === 0 || index === 1);

    if (isTopDrawer) {
        // Üst çekmeceler: X ekseninde dışa doğru açılmalı (farklı yönelim)
        // Dolabın arkasına gidiyorsa yönü tersine çevirelim (-pullAmount)
        const originalX = drawerOriginalX.get(drawer.uuid);

        // Eğer originalX yoksa (hata durumu), mevcut pozisyonu kullan
        const startX = (originalX !== undefined) ? originalX : drawer.position.x;

        const targetX = isOpen ? startX : startX - pullAmount;

        gsap.to(drawer.position, {
            x: targetX,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete: () => {
                drawerStates.set(drawer.uuid, !isOpen);
                updateDrawerButtonState(index, !isOpen);
            }
        });
    } else {
        // Normal çekmeceler: Z ekseninde dışa doğru
        const originalZ = drawerOriginalZ.get(drawer.uuid);
        const targetZ = isOpen ? originalZ : originalZ + pullAmount;

        gsap.to(drawer.position, {
            z: targetZ,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete: () => {
                drawerStates.set(drawer.uuid, !isOpen);
                updateDrawerButtonState(index, !isOpen);
            }
        });
    }
}

// Calculate drawer pull amount
function getDrawerPullAmount(drawer, index) {
    const bbox = new THREE.Box3().setFromObject(drawer);
    const size = bbox.getSize(new THREE.Vector3());
    // Çekmece derinliğinin %35'i kadar dışa çek (fazla açılmaması için)
    return Math.max(size.z, size.x) * 0.35;
}

// Toggle all drawers
function toggleAllDrawers() {
    const allClosed = Array.from(drawerStates.values()).every(s => !s);

    drawers.forEach((drawer, index) => {
        const currentState = drawerStates.get(drawer.uuid);
        if (allClosed || currentState) {
            toggleDrawer(index);
        }
    });
}

// Update drawer button visual state
function updateDrawerButtonState(index, isOpen) {
    const btn = document.querySelector(`button[data-drawer-index="${index}"]`);
    if (btn) {
        btn.classList.toggle('active', isOpen);
        // Text update is handled by CSS ::after or we can optionally keep it
    }
}

// Update button visual state
function updateButtonState(index, isOpen) {
    const btn = document.querySelector(`button[data-door-index="${index}"]`);
    if (btn) {
        btn.classList.toggle('active', isOpen);
    }
}

// Mouse move for hover detection
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(doors, true);

    if (intersects.length > 0) {
        container.classList.add('pointer');

        // Find the door
        let doorMesh = intersects[0].object;
        while (doorMesh && !doors.includes(doorMesh)) {
            doorMesh = doorMesh.parent;
        }

        if (doorMesh && doors.includes(doorMesh)) {
            const doorIndex = doors.indexOf(doorMesh);
            const isOpen = doorStates.get(doorMesh.uuid);

            tooltip.textContent = `Kapak ${doorIndex + 1} - ${isOpen ? 'Kapatmak için tıkla' : 'Açmak için tıkla'}`;
            tooltip.style.left = event.clientX + 15 + 'px';
            tooltip.style.top = event.clientY + 15 + 'px';
            tooltip.classList.add('visible');
        }
    } else {
        container.classList.remove('pointer');
        tooltip.classList.remove('visible');
    }
}

// Click to toggle door or drawer
function onClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Check doors first
    const doorIntersects = raycaster.intersectObjects(doors, true);
    if (doorIntersects.length > 0) {
        let doorMesh = doorIntersects[0].object;
        while (doorMesh && !doors.includes(doorMesh)) {
            doorMesh = doorMesh.parent;
        }
        if (doorMesh && doors.includes(doorMesh)) {
            const doorIndex = doors.indexOf(doorMesh);
            toggleDoor(doorIndex);
            return;
        }
    }

    // Check drawers
    const drawerIntersects = raycaster.intersectObjects(drawers, true);
    if (drawerIntersects.length > 0) {
        let drawerMesh = drawerIntersects[0].object;
        while (drawerMesh && !drawers.includes(drawerMesh)) {
            drawerMesh = drawerMesh.parent;
        }
        if (drawerMesh && drawers.includes(drawerMesh)) {
            const drawerIndex = drawers.indexOf(drawerMesh);
            toggleDrawer(drawerIndex);
        }
    }
}

// Event listeners
container.addEventListener('mousemove', onMouseMove);
container.addEventListener('click', onClick);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Window Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Sidebar Toggle Logic
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('product-sidebar');

if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('closed');
    });
}
