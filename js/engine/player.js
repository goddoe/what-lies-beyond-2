import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
  constructor(camera, renderer, scene) {
    this.camera = camera;
    this.scene = scene;

    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.speed = 4.0;
    this.height = 1.6;

    // Velocity for smooth movement
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    // Pointer lock controls
    this.controls = new PointerLockControls(camera, renderer.domElement);

    // Collision raycasting
    this.raycaster = new THREE.Raycaster();
    this.collisionDistance = 0.4;
    this.colliders = [];

    // Interaction raycasting
    this.interactRaycaster = new THREE.Raycaster();
    this.interactDistance = 3.0;
    this.interactables = [];
    this.currentInteractable = null;

    // Mouse movement tracking (for fourth_wall vs silence distinction)
    this.hasMouseMoved = false;
    this._mouseMovedThisFrame = false;
    this._onMouseMove = () => { this._mouseMovedThisFrame = true; };
    document.addEventListener('mousemove', this._onMouseMove);

    // Wall bump tracking
    this.wallBumpCount = 0;
    this.wallBumpTimer = 0;

    // Head bob
    this.bobTime = 0;
    this.bobAmplitude = 0.012;
    this.bobFrequency = 7;

    // Callbacks
    this.onLock = null;
    this.onUnlock = null;
    this.onWallBump = null;

    this._setupControls();
    this._setupKeyboard();
  }

  _setupControls() {
    this.controls.addEventListener('lock', () => {
      if (this.onLock) this.onLock();
    });

    this.controls.addEventListener('unlock', () => {
      this._resetKeys();
      if (this.onUnlock) this.onUnlock();
    });
  }

  _setupKeyboard() {
    this._onKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    this.moveForward = true; break;
        case 'KeyS': case 'ArrowDown':   this.moveBackward = true; break;
        case 'KeyA': case 'ArrowLeft':   this.moveLeft = true; break;
        case 'KeyD': case 'ArrowRight':  this.moveRight = true; break;
      }
    };

    this._onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    this.moveForward = false; break;
        case 'KeyS': case 'ArrowDown':   this.moveBackward = false; break;
        case 'KeyA': case 'ArrowLeft':   this.moveLeft = false; break;
        case 'KeyD': case 'ArrowRight':  this.moveRight = false; break;
      }
    };

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
  }

  _resetKeys() {
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
  }

  setColliders(meshes) {
    this.colliders = meshes;
  }

  setInteractables(items) {
    this.interactables = items;
  }

  /**
   * Check what interactable the player is looking at.
   * Returns the interactable object or null.
   */
  checkInteraction() {
    if (this.interactables.length === 0) return null;

    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);

    this.interactRaycaster.set(this.camera.position, dir);
    this.interactRaycaster.far = this.interactDistance;

    const meshes = this.interactables.map(i => i.mesh);
    const hits = this.interactRaycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      return this.interactables.find(i => i.mesh === hits[0].object) || null;
    }
    return null;
  }

  lock() {
    this.controls.lock();
  }

  get isLocked() {
    return this.controls.isLocked;
  }

  get position() {
    return this.camera.position;
  }

  getForwardDirection() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    return dir;
  }

  _checkCollision(moveDir) {
    if (this.colliders.length === 0) return false;

    const origin = this.camera.position.clone();
    origin.y -= 0.3; // Check at body level

    this.raycaster.set(origin, moveDir);
    this.raycaster.far = this.collisionDistance;

    const hits = this.raycaster.intersectObjects(this.colliders, false);
    return hits.length > 0;
  }

  update(delta) {
    if (!this.controls.isLocked) return;

    // Track mouse movement (reset each frame, set by mousemove listener)
    this.hasMouseMoved = this._mouseMovedThisFrame;
    this._mouseMovedThisFrame = false;

    // Damping
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    // Direction
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    if (this.moveForward || this.moveBackward) {
      this.velocity.z -= this.direction.z * this.speed * delta * 20;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x -= this.direction.x * this.speed * delta * 20;
    }

    // Compute proposed movement
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveZ = forward.clone().multiplyScalar(-this.velocity.z * delta);
    const moveX = right.clone().multiplyScalar(-this.velocity.x * delta);

    // Check collisions separately for each axis for wall sliding
    let hitWall = false;
    if (!this._checkCollision(moveZ.clone().normalize()) || moveZ.length() < 0.001) {
      this.camera.position.add(moveZ);
    } else if (moveZ.length() > 0.01) {
      hitWall = true;
    }
    if (!this._checkCollision(moveX.clone().normalize()) || moveX.length() < 0.001) {
      this.camera.position.add(moveX);
    } else if (moveX.length() > 0.01) {
      hitWall = true;
    }

    // Track wall bumps
    this.wallBumpTimer -= delta;
    if (hitWall && (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight)) {
      this.wallBumpCount++;
      if (this.wallBumpCount >= 5 && this.wallBumpTimer <= 0) {
        if (this.onWallBump) this.onWallBump(this.wallBumpCount);
        this.wallBumpCount = 0;
        this.wallBumpTimer = 10; // cooldown
      }
    } else {
      if (this.wallBumpTimer <= 0) this.wallBumpCount = 0;
    }

    // Head bob
    const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
    if (isMoving && !hitWall) {
      this.bobTime += delta * this.bobFrequency;
      const bob = Math.sin(this.bobTime * Math.PI * 2) * this.bobAmplitude;
      this.camera.position.y = this.height + bob;
    } else {
      // Smoothly return to center
      this.bobTime = 0;
      this.camera.position.y = this.height;
    }
  }
}
