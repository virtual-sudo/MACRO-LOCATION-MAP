import mapboxgl from 'https://cdn.skypack.dev/mapbox-gl';
import * as THREE from 'https://cdn.skypack.dev/three';
import { GLTFLoader } from 'https://cdn.skypack.dev/three/examples/jsm/loaders/GLTFLoader.js';

mapboxgl.accessToken =
'pk.eyJ1Ijoib2JqZWN0MzYwIiwiYSI6ImNtcGFybzkzNTAwOGwycXM2MnUzMGZ5YXEifQ.EviMelgRJfG7n3T9x0TNAA';

const map = new mapboxgl.Map({
    container: 'map',

    style: 'mapbox://styles/mapbox/standard',

    center: [120.8817, 14.3869],

    zoom: 18,
    pitch: 70,
    bearing: -20,

    antialias: true
});

map.on('style.load', () => {

    const modelOrigin = [120.8817, 14.3869];

    const modelAltitude = 0;

    const modelAsMercatorCoordinate =
        mapboxgl.MercatorCoordinate.fromLngLat(
            modelOrigin,
            modelAltitude
        );

    const modelTransform = {

        translateX: modelAsMercatorCoordinate.x,
        translateY: modelAsMercatorCoordinate.y,
        translateZ: modelAsMercatorCoordinate.z,

        rotateX: Math.PI / 2,
        rotateY: 0,
        rotateZ: 0,

        scale:
            modelAsMercatorCoordinate
            .meterInMercatorCoordinateUnits()
    };

    const customLayer = {

        id: '3d-model',
        type: 'custom',
        renderingMode: '3d',

        onAdd(map, gl) {

            this.camera = new THREE.Camera();

            this.scene = new THREE.Scene();

            // LIGHTING
            const light = new THREE.DirectionalLight(
                0xffffff,
                3
            );

            light.position.set(0, -70, 100);

            this.scene.add(light);

            // LOAD MODEL
            const loader = new GLTFLoader();

            loader.load(

                './BroadwalkMallFinal2.glb',

                (gltf) => {

                    this.model = gltf.scene;

                    // IMPORTANT:
                    // Adjust this value if model is too small/big
                    this.model.scale.set(
                        1,
                        1,
                        1
                    );

                    this.scene.add(this.model);

                    console.log('MODEL LOADED');

                },

                undefined,

                (error) => {

                    console.error(
                        'GLB LOAD ERROR:',
                        error
                    );
                }
            );

            this.renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });

            this.renderer.autoClear = false;
        },

        render(gl, matrix) {

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

            const m =
                new THREE.Matrix4().fromArray(matrix);

            const l = new THREE.Matrix4()

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

            this.camera.projectionMatrix =
                m.multiply(l);

            this.renderer.resetState();

            this.renderer.render(
                this.scene,
                this.camera
            );

            map.triggerRepaint();
        }
    };

    map.addLayer(customLayer);
});