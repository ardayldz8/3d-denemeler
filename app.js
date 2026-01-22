import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * 🎨 PHOTOREALISTIC 3D GALLERY VIEWER
 * Multi-model support with dynamic scene configuration
 * PBR materials, HDRI lighting, advanced post-processing
 */

class PhotorealisticViewer {
    constructor() {
        // Core components
        this.container = document.getElementById('canvas-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.composer = null;

        // Assets
        this.model = null;
        this.material = null;
        this.currentModelKey = 'marble'; // default model

        // Lighting
        this.lights = {};
        this.envMap = null;
        this.platform = null;
        this.shadowCatcher = null;

        // Post-processing
        this.bloomPass = null;
        this.ssaoPass = null;

        // State
        this.quality = 'medium'; // Changed from ultra for better performance
        this.stats = { fps: 0, triangles: 0, lastTime: performance.now(), frames: 0 };
        this.useDirectRendering = false; // Flag for high-poly direct rendering bypass

        // Model configurations
        this.modelConfigs = {
            marble: {
                path: './marble_bust_01_8k.gltf/marble_bust_01_8k.gltf',
                title: 'Marble Bust',
                scale: 2,
                position: [0, 0, 0],
                cameraPresets: {
                    front: { position: [0, 1.5, 3], target: [0, 1.2, 0] },
                    side: { position: [3, 1.3, 0.5], target: [0, 1.2, 0] },
                    top: { position: [0, 4, 0.5], target: [0, 1, 0] },
                    closeup: { position: [0, 1.6, 1.2], target: [0, 1.5, 0] }
                },
                material: {
                    roughness: 0.65,
                    metalness: 0.0,
                    envMapIntensity: 0.9
                },
                platformSize: 1.5
            },
            sneaker: {
                path: './new_balance_draco.glb', // Compressed
                title: 'New Balance 574',
                scale: 0.25,
                position: [0, 0.08, 0],
                cameraPresets: {
                    front: { position: [0, 0.15, 0.4], target: [0, 0.1, 0] },
                    side: { position: [0.4, 0.12, 0.05], target: [0, 0.1, 0] },
                    top: { position: [0, 0.5, 0.05], target: [0, 0.1, 0] },
                    closeup: { position: [0.15, 0.12, 0.2], target: [0, 0.1, 0] }
                },
                material: {
                    roughness: 0.5,
                    metalness: 0.0,
                    envMapIntensity: 1.0
                },
                platformSize: 0.4
            },
            carpet: {
                path: './carpet_draco.glb', // Compressed
                title: 'Persian Carpet',
                scale: 8.0,
                position: [0, 0.01, 0],
                cameraPresets: {
                    front: { position: [0, 4, 4], target: [0, 0, 0] },
                    side: { position: [4, 3, 2], target: [0, 0, 0] },
                    top: { position: [0, 8, 0.1], target: [0, 0, 0] },
                    closeup: { position: [1, 2, 1], target: [0, 0, 0] }
                },
                material: {
                    roughness: 0.7,
                    metalness: 0.0,
                    envMapIntensity: 0.6
                },
                platformSize: 2.0
            },
            armchair: {
                path: './armchair_draco.glb', // Compressed
                title: 'Kubrick Armchair',
                scale: 2.0, // Standard furniture scale (like marble bust)
                position: [0, 0, 0], // Sit directly on platform (ground level)
                cameraPresets: {
                    front: { position: [0, 1.0, 3], target: [0, 0.5, 0] },
                    side: { position: [3, 1.0, 1], target: [0, 0.5, 0] },
                    top: { position: [0, 4, 0.1], target: [0, 0, 0] },
                    closeup: { position: [1, 0.8, 1.5], target: [0, 0.5, 0] }
                },
                material: {
                    roughness: 0.8,
                    metalness: 0.0,
                    envMapIntensity: 0.8
                },
                platformSize: 1.5
            },
            rocking: {
                path: './rocking_draco.glb', // Compressed
                title: 'Kolton Rocking Chair',
                scale: 3.5, // Increased from 2.5
                position: [0, 0, 0],
                cameraPresets: {
                    front: { position: [0, 1.0, 3], target: [0, 0.5, 0] },
                    side: { position: [3, 1.0, 1], target: [0, 0.5, 0] },
                    top: { position: [0, 4, 0.1], target: [0, 0, 0] },
                    closeup: { position: [1, 0.8, 1.5], target: [0, 0.5, 0] }
                },
                material: {
                    roughness: 0.8,
                    metalness: 0.0,
                    envMapIntensity: 0.8
                },
                platformSize: 1.5
            }
        };


        this.init();
    }

    async init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.setupLights();
        await this.loadEnvironment();
        await this.loadModel(this.currentModelKey);
        this.setupPostProcessing();
        this.setupEventListeners();
        this.animate();
        this.hideLoadingScreen();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0f);
        this.scene.fog = new THREE.Fog(0x0a0a0f, 10, 50);
    }

    setupCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        this.camera.position.set(0, 1.5, 3);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1)); // Reduced for performance

        // Enable physically correct lighting with calibrated exposure
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.75;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // Enable shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.container.appendChild(this.renderer.domElement);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 0.1;
        this.controls.maxDistance = 8;
        this.controls.maxPolarAngle = Math.PI * 0.95;
        this.controls.target.set(0, 1.2, 0);
        this.controls.update();
    }

    setupLights() {
        // Ambient light for base illumination (warm museum tone)
        const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.5);
        this.scene.add(ambientLight);
        this.lights.ambient = ambientLight;

        // Key light (main) - DirectionalLight for natural, artifact-free illumination
        const keyLight = new THREE.DirectionalLight(0xfff8f0, 1.2);
        keyLight.position.set(4, 6, 3);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024; // Reduced for performance
        keyLight.shadow.mapSize.height = 1024;
        keyLight.shadow.camera.near = 0.1;
        keyLight.shadow.camera.far = 20;
        keyLight.shadow.camera.left = -5;
        keyLight.shadow.camera.right = 5;
        keyLight.shadow.camera.top = 5;
        keyLight.shadow.camera.bottom = -5;
        keyLight.shadow.bias = -0.0001;
        keyLight.shadow.radius = 2;
        this.scene.add(keyLight);
        this.lights.key = keyLight;

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xc8e0ff, 0.3);
        fillLight.position.set(-3, 2, 2);
        fillLight.castShadow = false;
        this.scene.add(fillLight);
        this.lights.fill = fillLight;

        // Rim light
        const rimLight = new THREE.DirectionalLight(0xffd8b1, 0.25);
        rimLight.position.set(0, 2, -4);
        rimLight.castShadow = false;
        this.scene.add(rimLight);
        this.lights.rim = rimLight;

        // Create platform
        this.createPlatform(1.5);
    }

    createPlatform(size) {
        // Remove existing
        if (this.platform) {
            this.scene.remove(this.platform);
            this.platform.geometry.dispose();
            this.platform.material.dispose();
        }
        if (this.shadowCatcher) {
            this.scene.remove(this.shadowCatcher);
            this.shadowCatcher.geometry.dispose();
            this.shadowCatcher.material.dispose();
        }

        // Platform
        const platformGeometry = new THREE.CylinderGeometry(size, size, 0.1, 64);
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.95, // Increased from 0.7 for matte finish
            metalness: 0.0,  // Reduced from 0.1 (non-metallic)
            envMapIntensity: 0.15 // Reduced from 0.3 to minimize reflections
        });
        this.platform = new THREE.Mesh(platformGeometry, platformMaterial);
        this.platform.position.y = -0.05;
        this.platform.receiveShadow = true;
        this.platform.castShadow = false;
        this.scene.add(this.platform);

        // Shadow catcher
        const shadowCatcherGeo = new THREE.CircleGeometry(size + 0.5, 64);
        const shadowCatcherMat = new THREE.ShadowMaterial({ opacity: 0.35 });
        this.shadowCatcher = new THREE.Mesh(shadowCatcherGeo, shadowCatcherMat);
        this.shadowCatcher.rotation.x = -Math.PI / 2;
        this.shadowCatcher.position.y = 0;
        this.shadowCatcher.receiveShadow = true;
        this.scene.add(this.shadowCatcher);
    }

    async loadEnvironment() {
        return new Promise((resolve) => {
            const rgbeLoader = new RGBELoader();
            const hdriUrl = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr';

            rgbeLoader.load(
                hdriUrl,
                (texture) => {
                    texture.mapping = THREE.EquirectangularReflectionMapping;
                    this.scene.environment = texture;
                    this.envMap = texture;
                    console.log('✅ HDRI environment loaded');
                    resolve();
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total) * 30;
                    this.updateLoadingProgress(percent);
                },
                (error) => {
                    console.warn('⚠️ HDRI failed, using fallback');
                    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
                    this.scene.environment = cubeRenderTarget.texture;
                    resolve();
                }
            );
        });
    }

    async loadModel(modelKey) {
        // Reset triangle count
        this.stats.triangles = 0;

        // Remove existing model
        if (this.model) {
            this.scene.remove(this.model);
            this.model.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.model = null;
            this.material = null;
        }

        const config = this.modelConfigs[modelKey];
        this.currentModelKey = modelKey;

        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();

            // Setup Draco Loader
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
            loader.setDRACOLoader(dracoLoader);

            loader.load(
                config.path,
                (gltf) => {
                    this.model = gltf.scene;

                    // Center and scale
                    const box = new THREE.Box3().setFromObject(this.model);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());

                    // DEBUG: Log model dimensions before scaling
                    console.log(`📦 ${config.title} ORIGINAL bounding box:`, {
                        center: { x: center.x.toFixed(4), y: center.y.toFixed(4), z: center.z.toFixed(4) },
                        size: { x: size.x.toFixed(4), y: size.y.toFixed(4), z: size.z.toFixed(4) },
                        maxDim: Math.max(size.x, size.y, size.z).toFixed(4)
                    });

                    // First, apply scale
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = config.scale / maxDim;
                    this.model.scale.setScalar(scale);

                    // DEBUG: Log scale applied
                    console.log(`📐 Scale applied: config.scale=${config.scale}, maxDim=${maxDim.toFixed(4)}, finalScale=${scale.toFixed(6)}`);

                    // Update world matrix after scaling to get correct bounds
                    this.model.updateMatrixWorld(true);

                    // Get the new bounding box AFTER scaling
                    const scaledBox = new THREE.Box3().setFromObject(this.model);
                    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
                    const scaledSize = scaledBox.getSize(new THREE.Vector3());

                    // Position the model so its base sits on Y=0 (ground level)
                    // Then add the config.position offset on top
                    const baseY = scaledBox.min.y; // Bottom of the model
                    this.model.position.set(
                        -scaledCenter.x + config.position[0],  // Center X + offset
                        -baseY + config.position[1],           // Place bottom at ground + offset
                        -scaledCenter.z + config.position[2]   // Center Z + offset
                    );

                    // DEBUG: Log final model position
                    console.log(`📍 Final model position:`, this.model.position);

                    // DEBUG: Check final bounding box after positioning
                    this.model.updateMatrixWorld(true);
                    const finalBox = new THREE.Box3().setFromObject(this.model);
                    const finalSize = finalBox.getSize(new THREE.Vector3());
                    const finalCenter = finalBox.getCenter(new THREE.Vector3());
                    console.log(`📦 ${config.title} FINAL bounding box:`, {
                        center: { x: finalCenter.x.toFixed(4), y: finalCenter.y.toFixed(4), z: finalCenter.z.toFixed(4) },
                        size: { x: finalSize.x.toFixed(4), y: finalSize.y.toFixed(4), z: finalSize.z.toFixed(4) },
                        minY: finalBox.min.y.toFixed(4)
                    });

                    // Setup materials
                    this.model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;

                            if (child.material) {
                                this.material = child.material;

                                if (child.material.isMeshStandardMaterial) {
                                    // Only apply config overrides for marble
                                    if (modelKey === 'marble') {
                                        child.material.envMapIntensity = config.material.envMapIntensity;
                                        child.material.roughness = config.material.roughness;
                                        child.material.metalness = config.material.metalness;

                                        if (child.material.color) {
                                            child.material.color.multiplyScalar(1.02);
                                        }
                                    }
                                    // For sneaker and carpet, preserve original materials
                                    else if (modelKey === 'sneaker' || modelKey === 'carpet') {
                                        // Only ensure environment mapping is active
                                        if (!child.material.envMapIntensity || child.material.envMapIntensity < 0.5) {
                                            child.material.envMapIntensity = 0.8;
                                        }
                                        // Keep original roughness, metalness, and color from GLB
                                    }

                                    if (child.material.map) {
                                        child.material.map.colorSpace = THREE.SRGBColorSpace;
                                    }

                                    child.material.needsUpdate = true;
                                }

                                if (child.geometry) {
                                    this.stats.triangles += child.geometry.index ?
                                        child.geometry.index.count / 3 :
                                        child.geometry.attributes.position.count / 3;
                                }
                            }
                        }
                    });

                    this.scene.add(this.model);

                    // Update platform
                    this.createPlatform(config.platformSize);

                    // Update UI
                    document.getElementById('poly-count').textContent =
                        Math.round(this.stats.triangles).toLocaleString();

                    // HIGH-POLY PERFORMANCE OPTIMIZATION
                    if (config.highPoly || this.stats.triangles > 200000) {
                        console.warn(`⚡ High-poly mode: ${Math.round(this.stats.triangles).toLocaleString()} tris - disabling expensive effects`);

                        // Disable shadows completely for this model
                        this.model.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = false;
                                child.receiveShadow = false;
                                child.frustumCulled = true; // Enable frustum culling
                                child.matrixAutoUpdate = false; // Static model optimization
                                child.updateMatrix(); // Update once
                            }
                        });
                        // Freeze model matrix
                        this.model.matrixAutoUpdate = false;
                        this.model.updateMatrixWorld(true);

                        // Disable post-processing passes
                        if (this.ssaoPass) this.ssaoPass.enabled = false;
                        if (this.bloomPass) this.bloomPass.enabled = false;

                        // Use direct rendering instead of composer for high-poly
                        this.useDirectRendering = true;

                        // Disable shadows at ALL levels
                        this.renderer.shadowMap.enabled = false;
                        this.lights.key.castShadow = false;

                        // Sync UI checkboxes
                        const shadowsCheckbox = document.getElementById('toggle-shadows');
                        if (shadowsCheckbox) shadowsCheckbox.checked = false;

                    } else {
                        this.useDirectRendering = false;
                        this.renderer.shadowMap.enabled = true;
                        this.lights.key.castShadow = true;
                    }

                    // Set camera
                    this.setCameraPreset('front');

                    console.log(`✅ ${config.title} loaded:`, {
                        triangles: Math.round(this.stats.triangles)
                    });

                    resolve();
                },
                (progress) => {
                    const percent = 30 + (progress.loaded / progress.total) * 70;
                    this.updateLoadingProgress(percent);
                },
                (error) => {
                    console.error('❌ Model loading failed:', error);
                    reject(error);
                }
            );
        });
    }

    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);

        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        this.ssaoPass = new SSAOPass(
            this.scene,
            this.camera,
            window.innerWidth,
            window.innerHeight
        );
        this.ssaoPass.kernelRadius = 8;
        this.ssaoPass.minDistance = 0.001;
        this.ssaoPass.maxDistance = 0.05;
        this.ssaoPass.output = SSAOPass.OUTPUT.Default;
        this.composer.addPass(this.ssaoPass);

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.15,
            0.6,
            0.92
        );
        this.composer.addPass(this.bloomPass);

        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);

        console.log('✅ Post-processing setup complete');
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());

        // Model selector
        document.getElementById('model-select').addEventListener('change', async (e) => {
            const modelKey = e.target.value;
            await this.loadModel(modelKey);
        });

        // Camera presets
        document.querySelectorAll('.preset-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                this.setCameraPreset(preset);

                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Quality toggle
        document.getElementById('quality-btn').addEventListener('click', () => {
            this.toggleQuality();
        });

        // Lighting controls
        document.getElementById('light-intensity').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.lights.key.intensity = value * 1.2;
            this.lights.fill.intensity = value * 0.3;
            this.lights.rim.intensity = value * 0.25;
        });

        document.getElementById('light-rotation').addEventListener('input', (e) => {
            const angle = (parseFloat(e.target.value) * Math.PI) / 180;
            const distance = 5;
            this.lights.key.position.x = Math.sin(angle) * distance;
            this.lights.key.position.z = Math.cos(angle) * distance;
        });

        document.getElementById('exposure').addEventListener('input', (e) => {
            this.renderer.toneMappingExposure = parseFloat(e.target.value);
        });

        // Material controls
        document.getElementById('roughness').addEventListener('input', (e) => {
            if (this.material && this.material.isMeshStandardMaterial) {
                this.material.roughness = parseFloat(e.target.value);
            }
        });

        document.getElementById('metalness').addEventListener('input', (e) => {
            if (this.material && this.material.isMeshStandardMaterial) {
                this.material.metalness = parseFloat(e.target.value);
            }
        });

        document.getElementById('normal-strength').addEventListener('input', (e) => {
            if (this.material && this.material.normalMap) {
                this.material.normalScale.set(
                    parseFloat(e.target.value),
                    parseFloat(e.target.value)
                );
            }
        });

        // Effects toggles
        document.getElementById('toggle-ssao').addEventListener('change', (e) => {
            this.ssaoPass.enabled = e.target.checked;
        });

        document.getElementById('toggle-bloom').addEventListener('change', (e) => {
            this.bloomPass.enabled = e.target.checked;
        });

        document.getElementById('toggle-shadows').addEventListener('change', (e) => {
            this.renderer.shadowMap.enabled = e.target.checked;
            this.lights.key.castShadow = e.target.checked;
        });

        document.getElementById('toggle-autorotate').addEventListener('change', (e) => {
            this.controls.autoRotate = e.target.checked;
            this.controls.autoRotateSpeed = 1.0;
        });

        document.getElementById('close-instructions').addEventListener('click', () => {
            document.getElementById('instructions').classList.add('hidden');
        });

        this.renderer.domElement.addEventListener('dblclick', () => {
            this.setCameraPreset('front');
        });
    }

    setCameraPreset(presetName) {
        const config = this.modelConfigs[this.currentModelKey];
        const preset = config.cameraPresets[presetName];
        if (!preset) return;

        const targetPos = new THREE.Vector3(...preset.position);
        const targetLookAt = new THREE.Vector3(...preset.target);

        const startPos = this.camera.position.clone();
        const startLookAt = this.controls.target.clone();

        const duration = 1000;
        const startTime = performance.now();

        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            this.camera.position.lerpVectors(startPos, targetPos, eased);
            this.controls.target.lerpVectors(startLookAt, targetLookAt, eased);
            this.controls.update();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    toggleQuality() {
        const qualities = ['ultra', 'high', 'medium'];
        const currentIndex = qualities.indexOf(this.quality);
        const nextIndex = (currentIndex + 1) % qualities.length;
        this.quality = qualities[nextIndex];

        const btn = document.querySelector('#quality-btn span');
        btn.textContent = this.quality.charAt(0).toUpperCase() + this.quality.slice(1);

        switch (this.quality) {
            case 'ultra':
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                this.renderer.shadowMap.enabled = true;
                this.ssaoPass.enabled = true;
                this.bloomPass.enabled = true;
                break;
            case 'high':
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
                this.renderer.shadowMap.enabled = true;
                this.ssaoPass.enabled = true;
                this.bloomPass.enabled = false;
                break;
            case 'medium':
                this.renderer.setPixelRatio(1);
                this.renderer.shadowMap.enabled = false;
                this.ssaoPass.enabled = false;
                this.bloomPass.enabled = false;
                break;
        }

        this.onWindowResize();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);

        if (this.ssaoPass) {
            this.ssaoPass.setSize(window.innerWidth, window.innerHeight);
        }
    }

    updateLoadingProgress(percent) {
        const progressBar = document.querySelector('.progress-bar');
        const percentageText = document.querySelector('.loading-percentage');

        if (progressBar) progressBar.style.width = `${percent}%`;
        if (percentageText) percentageText.textContent = `${Math.round(percent)}%`;
    }

    hideLoadingScreen() {
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
        }, 500);
    }

    updateStats() {
        this.stats.frames++;
        const currentTime = performance.now();

        if (currentTime >= this.stats.lastTime + 1000) {
            this.stats.fps = Math.round((this.stats.frames * 1000) / (currentTime - this.stats.lastTime));
            this.stats.frames = 0;
            this.stats.lastTime = currentTime;

            document.getElementById('fps').textContent = this.stats.fps;
            document.getElementById('tris').textContent =
                Math.round(this.stats.triangles).toLocaleString();
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.controls.update();
        this.updateStats();

        // Use direct rendering for high-poly models (much faster)
        if (this.useDirectRendering) {
            this.renderer.render(this.scene, this.camera);
        } else {
            this.composer.render();
        }
    }
}

// Initialize viewer
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.viewer = new PhotorealisticViewer();
    });
} else {
    window.viewer = new PhotorealisticViewer();
}
