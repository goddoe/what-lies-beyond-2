import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/**
 * Optional GLTF/GLB model loader.
 * Drop .glb files into assets/models/ to replace procedural props.
 *
 * Usage:
 *   const loader = new ModelLoader();
 *   if (loader.hasModel('desk')) {
 *     const model = await loader.load('desk');
 *     scene.add(model);
 *   }
 */
export class ModelLoader {
  constructor() {
    this._gltfLoader = new GLTFLoader();

    // DRACO decoder from CDN
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
    this._gltfLoader.setDRACOLoader(dracoLoader);

    // Registry: prop type → .glb path
    this._registry = new Map();

    // Cache loaded models
    this._cache = new Map();

    // Auto-detect available models
    this._detectModels();
  }

  /**
   * Check if a model is registered for this prop type.
   */
  hasModel(propType) {
    return this._registry.has(propType);
  }

  /**
   * Load and return a clone of the model for the given prop type.
   * @param {string} propType
   * @returns {Promise<THREE.Group>}
   */
  async load(propType) {
    if (!this._registry.has(propType)) return null;

    if (this._cache.has(propType)) {
      return this._cache.get(propType).clone();
    }

    const path = this._registry.get(propType);
    try {
      const gltf = await this._gltfLoader.loadAsync(path);
      const model = gltf.scene;

      // Enable shadows on all meshes
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this._cache.set(propType, model);
      return model.clone();
    } catch (e) {
      console.warn(`ModelLoader: Failed to load ${path}`, e);
      return null;
    }
  }

  /**
   * Create a wireframe placeholder shown while model loads.
   */
  getPlaceholder(sw, sh, sd) {
    const geo = new THREE.BoxGeometry(sw, sh, sd);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x444466,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    return new THREE.Mesh(geo, mat);
  }

  /**
   * Auto-detect models by checking known paths.
   * Models should be placed at: assets/models/{propType}.glb
   */
  _detectModels() {
    // Common prop types that could have models
    const propTypes = [
      'desk', 'chair', 'monitor', 'cabinet', 'rack',
      'table', 'shelf', 'vending', 'generator',
      'pipe', 'drum', 'tank', 'cooler',
    ];

    for (const type of propTypes) {
      const path = `assets/models/${type}.glb`;
      this._registry.set(type, path);
    }

    // Verify which models actually exist (non-blocking)
    this._verifyModels();
  }

  async _verifyModels() {
    const verified = new Map();
    for (const [type, path] of this._registry) {
      try {
        const resp = await fetch(path, { method: 'HEAD' });
        if (resp.ok) {
          verified.set(type, path);
        }
      } catch {
        // Model not available — will use procedural fallback
      }
    }
    this._registry = verified;
  }

  dispose() {
    for (const model of this._cache.values()) {
      model.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
    }
    this._cache.clear();
  }
}
