/// <reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="../typings/threejs/three-projector.d.ts" />

@component("track-ball")
class TrackBall extends polymer.Base {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    material: THREE.ShaderMaterial;
    camera: THREE.PerspectiveCamera;

    light: THREE.DirectionalLight;
    raycaster: THREE.Raycaster;
    isClick: boolean;
    onLightPosChanged: (pos: THREE.Vector3) => void;

    constructor() {
        super();
    }

    ready() {
        this._initRenderer();
        this._bindProjector();
        this._render();
    }

    // attached() {
    //     this._render();
    // }

    _initRenderer() {
        let width = 300;
        let height = 300;

        this.renderer = new THREE.WebGLRenderer({alpha: true});
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0x000000, 0);
        this.appendChild(this.renderer.domElement);

        let camPos = new THREE.Vector3(0, 2, 0);
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(camPos.x, camPos.y, camPos.z);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        this.scene = new THREE.Scene();
        this._setupScene(this.scene);
    }

    _bindProjector() {
        this.raycaster = new THREE.Raycaster();

        let _x = this;
        let canvas = this;
        canvas.onmousedown = e => { _x.isClick = true; };
        canvas.onmouseup = e => { _x.isClick = false; };

        canvas.onmousemove = event => {
            event.preventDefault();
            if (_x.isClick !== true) {
                return;
            }

            let mouse = new THREE.Vector2();
            mouse.x = ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1;
            mouse.y = -((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1;

            _x.raycaster.setFromCamera(mouse, _x.camera);
            let intersects = _x.raycaster.intersectObjects(_x.scene.children);
            if (intersects.length > 0) {
                let p = intersects[0].point;
                if (p.y <= 0.01) {
                    return;
                }

                // console.log(p);
                _x.light.position.set(p.x, p.y, p.z);
                this.fire("light-pos-changed", p.clone());
            }
        };
    }

    _setupScene(scene: THREE.Scene) {
        let material = new THREE.MeshPhongMaterial();
        let sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), material);
        sphere.translateY(-0.5); // translate to origin
        scene.add(sphere);

        // Setup lighting
        this.light = new THREE.DirectionalLight(0xffffff, 0.5);
        this.light.position.set(1, 0, 0);
        scene.add(this.light);
    }

     _render() {
        this.renderer.render(this.scene, this.camera);

        let self = this;
        requestAnimationFrame(function () {
            self._render();
        }.bind(this));
    }
}

TrackBall.register();