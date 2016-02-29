/// <reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="../typings/threejs/three-orbitcontrols.d.ts" />
/// <reference path="../elements/shader.ts" />

@component("brdf-viewport")
@behavior(Polymer["IronResizableBehavior"])
class BrdfViewport extends polymer.Base {

    renderer: THREE.WebGLRenderer;

    @property({type: THREE.Scene, observer: "renderJob"})
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    cameraControl: THREE.OrbitControls;
    lightArrow: THREE.ArrowHelper;
    viewArrow: THREE.ArrowHelper;
    plotObjs: Object;
    lightDir: THREE.Vector3;

    @property({observer: "renderJob"})
    visible = false;

    constructor() {
        super();
        this.visible = true;
        this.plotObjs = {};
        this.lightDir = new THREE.Vector3(0, 1, 0);
    }

    ready() {
        this._initRenderer();
        this.scene = new THREE.Scene();
        this._setupScene(this.scene);
    }

    attached() {
        this.async(this._resize, 1);
        // this.async(this.notifyResize, 1);
        // this.renderJob();
    }

    attributeChanged(name, type) {
        // TODO: only target for item-selected?
        this._resize();
    }

    _initRenderer() {
        let width = 300;
        let height = 300;

        this.renderer = new THREE.WebGLRenderer({alpha: true});
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0x000000, 0);
        this.appendChild(this.renderer.domElement);

        let camPos = new THREE.Vector3(10, 10, 10);
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(camPos.x, camPos.y, camPos.z);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        this.cameraControl = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.cameraControl.enablePan = false;
        this.cameraControl.addEventListener("change", this.renderJob.bind(this));
    }

    _setupScene(scene: THREE.Scene) {
        let circleGeometry = new THREE.CircleGeometry(5, 32);
        let solidMaterial = new THREE.MeshBasicMaterial({color: 0x777700, side: THREE.DoubleSide});
        let circle = new THREE.Mesh(circleGeometry, solidMaterial);
        circle.rotation.x = Math.PI * 0.5;
        circle.material.opacity = 0.1;
        scene.add(circle);

        scene.add(new THREE.GridHelper(10, 1));

        let bases = [
            {v: new THREE.Vector3(1, 0, 0), color: 0xFF0000},
            {v: new THREE.Vector3(0, 1, 0), color: 0x00FF00},
            {v: new THREE.Vector3(0, 0, 1), color: 0x0000FF}
        ];

        let origin = new THREE.Vector3(0, 0, 0);
        bases.forEach((element, index, array) => {
            let axis = new THREE.ArrowHelper(element.v, origin, 10.0, element.color, 1.0, 0.5);
            scene.add(axis);
        });

        let upDir = new THREE.Vector3(0, 1, 0);
        this.lightArrow = new THREE.ArrowHelper(upDir, origin, 10.0, 0xFFFF66, 1.0, 0.5);
        this.viewArrow = new THREE.ArrowHelper(upDir, origin, 10.0, 0x99CCFF, 1.0, 0.5);
        scene.add(this.lightArrow);
        scene.add(this.viewArrow);
    }

    addPlotObj(shaderName: string, uuid: string) {
        let shaderProp = pgLib[shaderName];

        // Instinate new shader
        let shaderInst = JSON.parse(JSON.stringify(plotObjMaterial));
        shaderInst.uniforms = THREE.UniformsUtils.merge([plotObjMaterial.uniforms, shaderProp.uniforms]);
        shaderInst.vertexShader = shaderInst.vertexShader.replace("{{PHASE_FUNCTION}}", shaderProp.brdf);

        // TODO: Apply sub-division algorithm to compute uniform vertex distribution on hemisphere.
        let material = new THREE.ShaderMaterial(shaderInst);
        material.uniforms.uLightPos.value = this.lightDir;

        let hemisphere = new THREE.Mesh(
            new THREE.SphereGeometry(5, 128, 32, 0, Math.PI * 2, 0, Math.PI * 0.5), material);
        this.scene.add(hemisphere);
        this.plotObjs[uuid] = hemisphere;
        this.renderJob();
    }

    removePlotObj(uuid: string) {
        this.scene.remove(this.plotObjs[uuid]);
        delete this.plotObjs[uuid];
        this.renderJob();
    }

    updateShaderParam(shaderProp) {
        let shaderName = shaderProp.shaderName;

        if (shaderName !== "all") {
            let uuid = shaderProp.uuid;
            let material = this.plotObjs[uuid].material;
            material.uniforms[shaderProp.name].value = shaderProp.value;
        } else {
            for (let key in this.plotObjs) {
                let material = this.plotObjs[key].material;
                material.uniforms[shaderProp.name].value = shaderProp.value;
            }
        }

        this.renderJob();
    }

    changeVisibility(state) {
        this.plotObjs[state.uuid].visible = state.visible;
        this.renderJob();
    }

    renderJob() {
        this.debounce("brdf-viewport-render-job", function() {
            requestAnimationFrame(this._render.bind(this));
        }, 1);
    }

    _render() {
        if (!this.visible) {
            return;
        }

        this.cameraControl.update();
        this.renderer.render(this.scene, this.camera);
    }

    @listen("iron-resize")
    _resize() {
        // Check visibility here.
        let width = this.clientWidth;
        let height = this.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.renderJob();
    }

    changeLightDir(lightDir: THREE.Vector3) {
        this.lightDir = lightDir;

        for (let key in this.plotObjs) {
            let plot = this.plotObjs[key];
            plot.material.uniforms.uLightPos.value = lightDir;
        }

        this.lightArrow.setDirection(lightDir);
        let viewDir = new THREE.Vector3(-lightDir.x, lightDir.y, -lightDir.z);
        this.viewArrow.setDirection(viewDir);
        this.renderJob();
    }
}

BrdfViewport.register();