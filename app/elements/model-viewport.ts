/// <reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="../typings/threejs/three-orbitcontrols.d.ts" />
/// <reference path="../typings/threejs/three-gltfloader.d.ts" />
/// <reference path="../elements/shader.ts" />

@component("model-viewport")
@behavior(Polymer["IronResizableBehavior"])
class ModelViewport extends polymer.Base {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    cameraControl: THREE.OrbitControls;
    model: THREE.Mesh;
    materialList: Object;
    gltfLoader: THREE.glTFLoader;

    @property({observer: "renderJob"})
    visible = false;

    constructor() {
        super();
        this.visible = false;
        this.gltfLoader = new THREE.glTFLoader();
        this.materialList = {};
    }

    ready() {
        this._initRenderer();
        this.scene = new THREE.Scene();
        this._setupScene(this.scene);
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
        let material = new THREE.ShaderMaterial(THREE.ShaderLib.basic);
        let sphere = new THREE.Mesh(
            new THREE.SphereGeometry(5, 64, 64, 0, Math.PI * 2, 0, Math.PI), material);
        this.model = sphere;
        this.scene.add(sphere);
    }

    addMaterial(shaderName: string, uuid: string) {
        let shaderProp = pgLib[shaderName];

        // Instinate new shader
        let shaderInst = JSON.parse(JSON.stringify(modelMaterial));
        shaderInst.uniforms = THREE.UniformsUtils.merge([modelMaterial.uniforms, shaderProp.uniforms]);
        shaderInst.fragmentShader = shaderInst.fragmentShader.replace("{{PHASE_FUNCTION}}", shaderProp.brdf);

        let material = new THREE.ShaderMaterial(shaderInst);
        let light = new THREE.DirectionalLight();
        material.uniforms.uLightPos.value = light.position;
        this.materialList[uuid] = material;
    }

    removeMaterial(uuid: string) {
        let material = this.materialList[uuid];
        this.model.material = undefined;
        delete this.materialList[uuid];

        // Assign default material if there is no shader in stock.
        if (Object.keys(this.materialList).length === 0) {
            this.model.material = new THREE.ShaderMaterial(THREE.ShaderLib.basic);
        }
        this.renderJob();
    }

    updateShaderParam(shaderProp) {
        let material = this.materialList[shaderProp.uuid];
        let paramName = shaderProp.name;
        if (material && paramName in material.uniforms) {
            material.uniforms[paramName].value = shaderProp.value;
            this.renderJob();
        }
    }

    changeShader(uuid: string) {
        if (this.materialList.hasOwnProperty(uuid)) {
            this.model.material = this.materialList[uuid];
            this.renderJob();
        }
    }

    _adjustCameraFocus(geometry) {
        geometry.center();
        let maxCorner = geometry.boundingBox.max;
        this.camera.position.copy(maxCorner.multiplyScalar(2.0));
    }

    changeModel(modelName: string) {
        if (modelName === "sphere") {
            let oldMaterial = this.model.material;
            this.scene.remove(this.model);
            let sphere = new THREE.Mesh(
                new THREE.SphereGeometry(5, 64, 64, 0, Math.PI * 2, 0, Math.PI), oldMaterial);
            this._adjustCameraFocus(sphere.geometry);
            this.model = sphere;
            this.scene.add(sphere);
            this.renderJob();
        } else {
            this.fire("toogle-spinner", true);
            this.gltfLoader.load(`assets/obj/${modelName}.gltf`,
                                this._onModelLoaded.bind(this));
        }
    }

    _onModelLoaded(data) {
        let oldMaterial = this.model.material;
        this.scene.remove(this.model);

        data.scene.traverse(function(child) {
        if (child instanceof THREE.Mesh) {
            this.model = child;
            this.model.material = oldMaterial;
            this.scene.add(child);
            this._adjustCameraFocus(child.geometry);
            }
        }.bind(this));

        this.fire("toogle-spinner", false);
        this.renderJob();
    }

    renderJob() {
        this.debounce("model-viewport-render-job", function() {
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
        let width = this.clientWidth;
        let height = this.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.renderJob();
    }

    changeLightDir(lightDir: THREE.Vector3) {
        let material = <THREE.ShaderMaterial>(this.model.material);
        if (material.uniforms.hasOwnProperty("uLightPos")) {
            material.uniforms.uLightPos.value = lightDir;
        }
        this.renderJob();
    }
}

ModelViewport.register();