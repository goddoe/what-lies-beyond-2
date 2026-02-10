import * as THREE from 'three';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a25);
    this.scene.fog = new THREE.Fog(0x1a1a25, 12, 60);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 1.6, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 2.4;

    // Shadows disabled for performance
    this.renderer.shadowMap.enabled = false;

    // Uniform ambient lighting — no per-room PointLights for performance
    // HemisphereLight gives subtle top/bottom color variation
    this.hemiLight = new THREE.HemisphereLight(0x8899bb, 0x445566, 3.5);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0x8090b0, 3.2);
    this.scene.add(this.ambientLight);

    // Resize handler
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  setFogColor(color) {
    this.scene.fog.color.set(color);
    this.scene.background.set(color);
  }

  setExposure(value) {
    this.renderer.toneMappingExposure = value;
  }

  setFogNear(value) {
    this.scene.fog.near = value;
  }

  setFogFar(value) {
    this.scene.fog.far = value;
  }
}
