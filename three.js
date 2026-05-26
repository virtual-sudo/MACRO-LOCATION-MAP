import mapboxgl from 'mapbox-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ======================================================
// MAPBOX TOKEN
// ======================================================

mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

// ======================================================
// MAP SETUP
// ======================================================

const map = new mapboxgl.Map({
    container: 'map',

    // MAP STYLE
    style: 'mapbox://styles/mapbox/standard',

    // START POSITION
    center: [121.056, 14.650], // Quezon City

    zoom: 18,
    pitch: 70,
    bearing: -20,

    antialias: true
});

// ======================================================
// WAIT FOR STYLE TO LOAD
// ======================================================

map.on('style.load', () => {

    // ==================================================
    // MODEL SETTINGS
    // ==================================================

    // LONGITUDE, LATITUDE
    const modelOrigin = [121.056, 14.650];

    // HEIGHT IN METERS
    const modelAltitude = 0;

    // ROTATION
    const modelRotate = [
        Math.PI / 2, // X
        0,           // Y
        0            // Z
    ];

    // ==================================================
    // CONVERT TO MAPBOX COORDINATES
    // ==================================================

    const mercatorCoordinate =
        mapboxgl.MercatorCoordinate.fromLngLat(
            modelOrigin,
            modelAltitude
        );

    // ==================================================
    // MODEL TRANSFORM
    // ==================================================

    const modelTransform = {
        translateX: mercatorCoordinate.x,
        translateY: mercatorCoordinate.y,
        translateZ: mercatorCoordinate.z,

        rotateX: modelRotate[0],
        rotateY: modelRotate[1],
        rotateZ: modelRotate[2],

        scale: mercatorCoordinate.meterInMercatorCoordinateUnits()
    };

    // ==================================================
    // CUSTOM LAYER
    // ==================================================

    const customLayer = {
        id: '3d-model',
        type: 'custom',
        renderingMode: '3d',

        onAdd: function (map, gl) {

            // ==========================================
            // CAMERA
            // ==========================================

            this.camera = new THREE.Camera();

            // ==========================================
            // SCENE
            // ==========================================

            this.scene = new THREE.Scene();

            // ==========================================
            // LIGHTING
            // ==========================================

            const ambientLight = new THREE.AmbientLight(
                0xffffff,
                1
            );

            this.scene.add(ambientLight);

            const directionalLight1 =
                new THREE.DirectionalLight(0xffffff, 1);

            directionalLight1.position.set(100, 100, 200);

            this.scene.add(directionalLight1);

            const directionalLight2 =
                new THREE.DirectionalLight(0xffffff, 0.5);

            directionalLight2.position.set(-100, -100, 200);

            this.scene.add(directionalLight2);

            // ==========================================
            // LOAD GLB MODEL
            // ==========================================

            const loader = new GLTFLoader();

            loader.load(

                // PATH TO MODEL
                './model.glb',

                // SUCCESS
                (gltf) => {

                    this.model = gltf.scene;

                    // ==============================
                    // OPTIONAL MODEL SCALE
                    // ==============================

                    this.model.scale.set(
                        10,
                        10,
                        10
                    );

                    // ==============================
                    // OPTIONAL MODEL POSITION
                    // ==============================

                    this.model.position.set(0, 0, 0);

                    // ==============================
                    // OPTIONAL SHADOWS
                    // ==============================

                    this.model.traverse((node) => {

                        if (node.isMesh) {

                            node.castShadow = true;
                            node.receiveShadow = true;
                        }
                    });

                    // ==============================
                    // ADD TO SCENE
                    // ==============================

                    this.scene.add(this.model);

                    console.log('GLB model loaded successfully');

                },

                // PROGRESS
                (xhr) => {

                    console.log(
                        (xhr.loaded / xhr.total * 100)
                        + '% loaded'
                    );
                },

                // ERROR
                (error) => {

                    console.error(
                        'Error loading GLB:',
                        error
                    );
                }
            );

            // ==========================================
            // THREE RENDERER
            // ==========================================

            this.renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });

            this.renderer.autoClear = false;

            this.renderer.shadowMap.enabled = true;
        },

        render: function (gl, matrix) {

            // ==========================================
            // ROTATION MATRICES
            // ==========================================

            const rotationX =
                new THREE.Matrix4().makeRotationAxis(
                    new THREE.Vector3(1, 0, 0),
                    modelTransform.rotateX
                );

            const rotationY =
                new THREE.Matrix4().makeRotationAxis(
                    new THREE.Vector3(0, 1, 0),
                    modelTransform.rotateY
                );

            const rotationZ =
                new THREE.Matrix4().makeRotationAxis(
                    new THREE.Vector3(0, 0, 1),
                    modelTransform.rotateZ
                );

            // ==========================================
            // MAP MATRIX
            // ==========================================

            const mapMatrix =
                new THREE.Matrix4().fromArray(matrix);

            // ==========================================
            // MODEL MATRIX
            // ==========================================

            const modelMatrix =
                new THREE.Matrix4()
                    .makeTranslation(
                        modelTransform.translateX,
                        modelTransform.translateY,
                        modelTransform.translateZ
                    )

                    .scale(
                        new THREE.Vector3(
                            modelTransform.scale,
                            -modelTransform.scale,
                            modelTransform.scale
                        )
                    )

                    .multiply(rotationX)
                    .multiply(rotationY)
                    .multiply(rotationZ);

            // ==========================================
            // APPLY MATRIX TO CAMERA
            // ==========================================

            this.camera.projectionMatrix =
                mapMatrix.multiply(modelMatrix);

            // ==========================================
            // RESET STATE
            // ==========================================

            this.renderer.resetState();

            // ==========================================
            // RENDER SCENE
            // ==========================================

            this.renderer.render(
                this.scene,
                this.camera
            );

            // ==========================================
            // UPDATE MAP
            // ==========================================

            map.triggerRepaint();
        }
    };

    // ==================================================
    // ADD LAYER TO MAP
    // ==================================================

    map.addLayer(customLayer);

    console.log('3D custom layer added');
});

// ======================================================
// MAP CONTROLS
// ======================================================

map.addControl(
    new mapboxgl.NavigationControl()
);

// ======================================================
// DEBUG EVENTS
// ======================================================

map.on('load', () => {
    console.log('Map fully loaded');
});

map.on('error', (e) => {
    console.error('Mapbox error:', e);
});