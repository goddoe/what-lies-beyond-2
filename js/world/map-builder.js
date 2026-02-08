import * as THREE from 'three';
import { ROOMS, CONNECTIONS } from './map-data.js';

/**
 * Builds Three.js meshes from room data.
 * Returns { group, colliders, triggerZones, interactables }
 */
export class MapBuilder {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.colliders = [];
    this.triggerZones = [];
    this.interactables = [];
    this.lights = [];
    this.wallMeshes = new Map(); // roomId_wall → mesh (for unlockDoor)

    // Shared materials cache (optimization: reuse materials for same colors)
    this._matCache = new Map();

    scene.add(this.group);
  }

  build() {
    for (const room of ROOMS) {
      this._buildRoom(room);
    }
    return {
      colliders: this.colliders,
      triggerZones: this.triggerZones,
      interactables: this.interactables,
    };
  }

  /**
   * Remove a wall section to "unlock" a door.
   * @param {string} roomId
   * @param {string} wall - 'north'|'south'|'east'|'west'
   */
  unlockDoor(roomId, wall) {
    const key = `${roomId}_${wall}_locked`;
    const meshes = this.wallMeshes.get(key);
    if (meshes) {
      for (const mesh of meshes) {
        this.group.remove(mesh);
        const ci = this.colliders.indexOf(mesh);
        if (ci >= 0) this.colliders.splice(ci, 1);
        mesh.geometry.dispose();
      }
      this.wallMeshes.delete(key);
    }
  }

  _getOrCreateMaterial(color, opts = {}) {
    const key = `${color}_${opts.roughness || 0.85}_${opts.metalness || 0.05}`;
    if (this._matCache.has(key)) return this._matCache.get(key);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness || 0.85,
      metalness: opts.metalness || 0.05,
    });
    this._matCache.set(key, mat);
    return mat;
  }

  _buildRoom(room) {
    const [ox, oy, oz] = room.origin;
    const [w, h, d] = room.size;
    const halfW = w / 2;
    const halfD = d / 2;

    // Collect door positions for this room
    const doors = this._getDoorPositions(room);

    // Floor
    this._addPlane(ox, oy, oz, w, d, room.floorColor, 'floor');

    // Ceiling
    this._addPlane(ox, oy + h, oz, w, d, room.ceilingColor || room.wallColor, 'ceiling');

    // Walls - build with door cutouts
    this._buildWall(room, 'north', ox, oy, oz - halfD, w, h, 'z', doors);
    this._buildWall(room, 'south', ox, oy, oz + halfD, w, h, 'z', doors);
    this._buildWall(room, 'east', ox + halfW, oy, oz, d, h, 'x', doors);
    this._buildWall(room, 'west', ox - halfW, oy, oz, d, h, 'x', doors);

    // Room light (skip for corridors with noLight flag)
    if (!room.noLight) {
      const lightY = oy + h - 0.1;
      const lp = room.lightPos;
      const lightX = lp ? ox + lp[0] : ox;
      const lightZ = lp ? oz + lp[2] : oz;

      // Three.js r160 uses physical light units (candela for PointLight)
      const sizeMultiplier = (w > 6 || d > 6) ? 1.4 : 1.0;
      const physicalIntensity = room.lightIntensity * 100 * sizeMultiplier;
      const lightRange = Math.max(w, d) * 3;

      const pointLight = new THREE.PointLight(
        room.lightColor,
        physicalIntensity,
        lightRange
      );
      pointLight.position.set(lightX, lightY, lightZ);
      pointLight.castShadow = false;
      pointLight.decay = 2;
      this.group.add(pointLight);
      this.lights.push({ light: pointLight, room: room.id });
    }

    // Triggers
    for (const trig of room.triggers) {
      const [tx, ty, tz] = trig.position;
      const [tw, th, td] = trig.size;
      const box = new THREE.Box3(
        new THREE.Vector3(ox + tx - tw / 2, oy + ty - th / 2, oz + tz - td / 2),
        new THREE.Vector3(ox + tx + tw / 2, oy + ty + th / 2, oz + tz + td / 2)
      );
      this.triggerZones.push({ id: trig.id, box, room: room.id, fired: false });
    }

    // Props
    for (const prop of room.props) {
      this._buildProp(prop, ox, oy, oz, room.id);
    }
  }

  _getDoorPositions(room) {
    const doorInfos = [];
    for (const door of room.doors) {
      doorInfos.push({
        wall: door.wall,
        offset: door.offset || 0,
        width: door.width || 2,
        height: door.height || 2.5,
        locked: door.locked || false,
      });
    }
    return doorInfos;
  }

  _buildWall(room, wallName, wx, wy, wz, wallLength, wallHeight, axis, doors) {
    const wallDoors = doors.filter(d => d.wall === wallName);

    if (wallDoors.length === 0) {
      // Solid wall
      this._addWallMesh(room, wx, wy, wz, wallLength, wallHeight, axis);
      return;
    }

    // Wall with door cutout(s)
    for (const door of wallDoors) {
      const doorWidth = door.width;
      const doorHeight = door.height;
      const doorOffset = door.offset;

      if (door.locked) {
        // Locked door: build as solid wall, track for removal
        this._addWallMesh(room, wx, wy, wz, wallLength, wallHeight, axis, `${room.id}_${wallName}_locked`);
        return; // locked door = entire wall is solid
      }

      // Left section
      const leftLength = (wallLength / 2) - (doorWidth / 2) + doorOffset;
      if (leftLength > 0.01) {
        const leftCenter = -(wallLength / 2) + leftLength / 2;
        if (axis === 'z') {
          this._addWallMesh(room, wx + leftCenter, wy, wz, leftLength, wallHeight, axis);
        } else {
          this._addWallMesh(room, wx, wy, wz + leftCenter, leftLength, wallHeight, axis);
        }
      }

      // Right section
      const rightLength = (wallLength / 2) - (doorWidth / 2) - doorOffset;
      if (rightLength > 0.01) {
        const rightCenter = (wallLength / 2) - rightLength / 2;
        if (axis === 'z') {
          this._addWallMesh(room, wx + rightCenter, wy, wz, rightLength, wallHeight, axis);
        } else {
          this._addWallMesh(room, wx, wy, wz + rightCenter, rightLength, wallHeight, axis);
        }
      }

      // Top section above door
      const topHeight = wallHeight - doorHeight;
      if (topHeight > 0.01) {
        if (axis === 'z') {
          this._addWallMesh(room, wx + doorOffset, wy + doorHeight, wz, doorWidth, topHeight, axis);
        } else {
          this._addWallMesh(room, wx, wy + doorHeight, wz + doorOffset, doorWidth, topHeight, axis);
        }
      }
    }
  }

  _addWallMesh(room, cx, cy, cz, length, height, axis, trackKey = null) {
    const thickness = 0.2;
    let geo;
    if (axis === 'z') {
      geo = new THREE.BoxGeometry(length, height, thickness);
    } else {
      geo = new THREE.BoxGeometry(thickness, height, length);
    }

    const mat = this._getOrCreateMaterial(room.wallColor);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, cy + height / 2, cz);
    mesh.receiveShadow = true;
    this.group.add(mesh);
    this.colliders.push(mesh);

    // Track locked wall meshes for unlockDoor
    if (trackKey) {
      if (!this.wallMeshes.has(trackKey)) {
        this.wallMeshes.set(trackKey, []);
      }
      this.wallMeshes.get(trackKey).push(mesh);
    }
  }

  _addPlane(cx, cy, cz, w, d, color, type) {
    const geo = new THREE.BoxGeometry(w, 0.1, d);
    const mat = this._getOrCreateMaterial(color, { roughness: 0.9, metalness: 0.0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, cy + (type === 'floor' ? -0.05 : 0.05), cz);
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  _buildProp(prop, ox, oy, oz, roomId) {
    const [px, py, pz] = prop.position;
    const [sw, sh, sd] = prop.size;

    const geo = new THREE.BoxGeometry(sw, sh, sd);

    // Emissive props - screens, LEDs, warning lights, documents
    const emissiveTypes = {
      'monitor':       { color: 0x112244, intensity: 0.3 },
      'monitor_wall':  { color: 0x112255, intensity: 0.4 },
      'console':       { color: 0x112244, intensity: 0.3 },
      'led':           { color: null, intensity: 0.8 },
      'warning_light': { color: null, intensity: 1.0 },
      'window':        { color: 0x050515, intensity: 0.15 },
      'document':      { color: 0x886611, intensity: 0.5 },
    };

    const emissive = emissiveTypes[prop.type];
    let mat;

    if (emissive) {
      // Emissive props get their own material (can't share due to emissive settings)
      mat = new THREE.MeshStandardMaterial({
        color: prop.color,
        roughness: 0.3,
        metalness: 0.2,
        emissive: new THREE.Color(emissive.color !== null ? emissive.color : prop.color),
        emissiveIntensity: emissive.intensity,
      });
    } else {
      mat = this._getOrCreateMaterial(prop.color, { roughness: 0.7, metalness: 0.1 });
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(ox + px, oy + py + sh / 2, oz + pz);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.group.add(mesh);

    // Skip colliders for very small decorative props (optimization)
    const isSmall = sw < 0.2 && sd < 0.2;
    if (!isSmall) {
      this.colliders.push(mesh);
    }

    // Interactable types
    const interactableTypes = ['monitor', 'monitor_wall', 'console', 'document'];
    if (interactableTypes.includes(prop.type)) {
      this.interactables.push({
        mesh,
        type: prop.type,
        room: roomId,
        propId: prop.id || null,
      });
    }
  }

  /**
   * Get the room the player is currently in based on position.
   */
  getRoomAtPosition(pos) {
    for (const room of ROOMS) {
      const [ox, , oz] = room.origin;
      const [w, , d] = room.size;
      if (
        pos.x >= ox - w / 2 - 0.5 && pos.x <= ox + w / 2 + 0.5 &&
        pos.z >= oz - d / 2 - 0.5 && pos.z <= oz + d / 2 + 0.5
      ) {
        return room;
      }
    }
    return null;
  }
}
