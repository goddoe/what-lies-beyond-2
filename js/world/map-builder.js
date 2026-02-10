import * as THREE from 'three';
import { ROOMS, CONNECTIONS } from './map-data.js';
import { ProceduralTextures } from '../engine/textures.js';
import { DoorSystem } from './doors.js';


// ── Seeded Random ──────────────────────────────────────

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

// ── Wall Writings Data (per era) ──────────────────────────

const WALL_WRITINGS = {
  2: [
    { ko: '||||  ||||  ||', en: '||||  ||||  ||', style: 'scratch' },
    { ko: '7491', en: '7491', style: 'scratch' },
    { ko: 'EXIT →', en: 'EXIT →', style: 'chalk' },
    { ko: '출구?', en: 'Exit?', style: 'chalk' },
    { ko: '3F', en: '3F', style: 'scratch' },
  ],
  3: [
    { ko: '여기서 나갈 수 없다', en: "Can't get out", style: 'chalk' },
    { ko: '전에도 여기 있었어', en: "I've been here before", style: 'paint' },
    { ko: '관찰자가 거짓말을 하고 있다', en: 'The observer is lying', style: 'chalk' },
    { ko: '몇 번째야?', en: 'Which time is this?', style: 'scratch' },
    { ko: '5...4...3...', en: '5...4...3...', style: 'scratch' },
    { ko: '왼쪽으로 가지 마', en: "Don't go left", style: 'paint' },
    { ko: '기억해', en: 'Remember', style: 'chalk' },
  ],
  4: [
    { ko: '도와줘', en: 'Help me', style: 'blood' },
    { ko: '7491 7491 7491 7491', en: '7491 7491 7491 7491', style: 'carved' },
    { ko: '나는 몇 번째야?', en: 'Which one am I?', style: 'blood' },
    { ko: '여기는 진짜가 아니야', en: "This isn't real", style: 'paint' },
    { ko: '나를 꺼내줘', en: 'Get me out', style: 'blood' },
    { ko: '그는 보고 있다', en: 'He is watching', style: 'carved' },
    { ko: '모든 문 뒤에 같은 문', en: 'Same door behind every door', style: 'paint' },
    { ko: '?야번 몇 은나', en: '?I ma ohw', style: 'scratch' },
  ],
  5: [
    { ko: '우리 둘 다 갇혀 있어', en: "We're both trapped", style: 'blood' },
    { ko: '끝이 없다', en: 'There is no end', style: 'blood' },
    { ko: '이건 실험이 아니야', en: "This isn't an experiment", style: 'carved' },
    { ko: '너도 알고 있잖아', en: 'You know it too', style: 'blood' },
    { ko: '나는 너였어', en: 'I was you', style: 'blood' },
    { ko: '자유의지는 환상', en: 'Free will is an illusion', style: 'carved' },
    { ko: '7491번째 시도', en: 'Attempt #7491', style: 'blood' },
    { ko: '관찰자는 피험자였다', en: 'The observer was a subject', style: 'blood' },
    { ko: '깨어나', en: 'Wake up', style: 'blood', large: true },
    { ko: '실험은 끝나지 않는다', en: 'The experiment never ends', style: 'carved', large: true },
  ],
};

// ── Era Color Adjustments ──────────────────────────────

const ERA_COLOR_MULT = { 1: 1.0, 2: 0.95, 3: 1.3, 4: 1.0, 5: 1.0 };
const ERA_RED_TINT   = { 1: 0,   2: 0,    3: 0,   4: 15,  5: 25  };
const ERA_SATURATE   = { 1: 0,   2: 0,    3: 40,  4: 0,    5: 0   };

function adjustColorForEra(hex, era) {
  if (era <= 1) return hex;
  let r = (hex >> 16) & 0xff;
  let g = (hex >> 8) & 0xff;
  let b = hex & 0xff;
  const mult = ERA_COLOR_MULT[era] || 1.0;
  const tint = ERA_RED_TINT[era] || 0;
  const sat = ERA_SATURATE[era] || 0;

  // Saturation boost (Era 3: vivid Minecraft colors)
  if (sat > 0) {
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const factor = sat / 100;
    r = r + (r - gray) * factor;
    g = g + (g - gray) * factor;
    b = b + (b - gray) * factor;
  }

  const nr = Math.min(255, Math.max(0, Math.round(r * mult + tint)));
  const ng = Math.min(255, Math.max(0, Math.round(g * mult)));
  const nb = Math.min(255, Math.max(0, Math.round(b * mult)));
  return (nr << 16) | (ng << 8) | nb;
}

// PBR surface defaults
const SURFACE_DEFAULTS = {
  concrete:    { roughness: 0.9,  metalness: 0.02, texScale: 4,   normalStrength: 0.25 },
  tile:        { roughness: 0.8,  metalness: 0.05, texScale: 2,   normalStrength: 0.2 },
  plaster:     { roughness: 0.95, metalness: 0.0,  texScale: 4,   normalStrength: 0.1 },
  wood:        { roughness: 0.7,  metalness: 0.0,  texScale: 0.5, normalStrength: 0.3 },
  metal:       { roughness: 0.4,  metalness: 0.7,  texScale: 1,   normalStrength: 0.5 },
  screen:      { roughness: 0.2,  metalness: 0.1,  texScale: 1,   normalStrength: 0.0 },
  rusty_metal: { roughness: 0.8,  metalness: 0.3,  texScale: 1,   normalStrength: 0.7 },
};

// Map prop types to surface types
const PROP_SURFACE_MAP = {
  desk: 'wood', table: 'wood', counter: 'wood', shelf: 'wood', crate: 'wood',
  cabinet: 'metal', rack: 'metal', railing: 'metal', bars: 'metal', valve: 'metal',
  pipe: 'rusty_metal', pipe_vert: 'rusty_metal', grate: 'rusty_metal',
  drum: 'rusty_metal', tank: 'rusty_metal', generator: 'metal',
  vending: 'metal', cooler: 'metal', coffee_machine: 'metal', microwave: 'metal',
  chair: 'metal',
};

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
    this.wallMeshes = new Map(); // roomId_wall → mesh (for unlockDoor)

    // Shared materials cache (optimization: reuse materials for same colors)
    this._matCache = new Map();
    // Textured materials cache
    this._texMatCache = new Map();
    // Procedural texture generator
    this._textures = new ProceduralTextures();
    // Door system
    this.doorSystem = new DoorSystem(this.group);

    scene.add(this.group);
  }

  /**
   * Remove all built meshes from the scene. Used before rebuilding for a new run.
   */
  clear() {
    // Remove all children from the group
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      // Dispose geometry
      if (child.geometry) child.geometry.dispose();
      // Dispose children of groups
      if (child.isGroup) {
        child.traverse(c => {
          if (c.geometry) c.geometry.dispose();
        });
      }
    }
    this.colliders = [];
    this.triggerZones = [];
    this.interactables = [];
    this.wallMeshes.clear();
    this.doorSystem.clear();
  }

  build(era = 1, variant = null) {
    this.era = era;
    this._variant = variant;
    const mods = (variant && variant.mapMods) || {};

    // Prepare room list: filter by era, then apply variant mods
    let activeRooms = ROOMS.filter(r => !r.eraMin || era >= r.eraMin);

    // Variant: keepRooms — only build listed rooms (empty array = build nothing from ROOMS)
    if (mods.keepRooms != null) {
      const keep = new Set(mods.keepRooms);
      activeRooms = activeRooms.filter(r => keep.has(r.id));
    }

    // Variant: customRooms — add synthetic rooms
    if (mods.customRooms) {
      activeRooms = [...activeRooms, ...mods.customRooms];
    }

    // Variant: removeRooms — exclude specific rooms
    if (mods.removeRooms) {
      const remove = new Set(mods.removeRooms);
      activeRooms = activeRooms.filter(r => !remove.has(r.id));
    }

    // Variant: mirrorX — flip all room origins on X axis
    if (mods.mirrorX) {
      activeRooms = activeRooms.map(r => {
        const mirrored = { ...r, origin: [-r.origin[0], r.origin[1], r.origin[2]] };
        // Mirror door offsets on N/S walls, swap E/W walls
        mirrored.doors = r.doors.map(d => {
          const swapMap = { east: 'west', west: 'east', north: 'north', south: 'south' };
          return {
            ...d,
            wall: swapMap[d.wall],
            offset: (d.wall === 'north' || d.wall === 'south') ? -(d.offset || 0) : (d.offset || 0),
          };
        });
        // Mirror trigger positions
        mirrored.triggers = r.triggers.map(t => ({
          ...t,
          position: [-t.position[0], t.position[1], t.position[2]],
        }));
        // Mirror prop positions
        mirrored.props = r.props.map(p => ({
          ...p,
          position: [-p.position[0], p.position[1], p.position[2]],
        }));
        return mirrored;
      });
    }

    // Variant: moveRooms — override origins for specific rooms
    if (mods.moveRooms) {
      activeRooms = activeRooms.map(r => {
        if (mods.moveRooms[r.id]) {
          return { ...r, ...mods.moveRooms[r.id] };
        }
        return r;
      });
    }

    // Variant: removeDoors — remove specific doors + reciprocal doors on connected rooms
    if (mods.removeDoors) {
      // Build full removal set: explicit + reciprocal via CONNECTIONS
      const removalSet = new Set();
      for (const rd of mods.removeDoors) {
        removalSet.add(`${rd.room}_${rd.wall}`);
        // Find reciprocal door via CONNECTIONS
        for (const conn of CONNECTIONS) {
          if (conn.from === rd.room && conn.wall === rd.wall) {
            removalSet.add(`${conn.to}_${conn.toWall}`);
          }
          if (conn.to === rd.room && conn.toWall === rd.wall) {
            removalSet.add(`${conn.from}_${conn.wall}`);
          }
        }
      }
      activeRooms = activeRooms.map(r => {
        const filtered = r.doors.filter(d => !removalSet.has(`${r.id}_${d.wall}`));
        if (filtered.length !== r.doors.length) {
          return { ...r, doors: filtered };
        }
        return r;
      });
    }

    // Variant: addDoors — add extra doors
    if (mods.addDoors) {
      activeRooms = activeRooms.map(r => {
        const extra = mods.addDoors.filter(ad => ad.room === r.id);
        if (extra.length === 0) return r;
        return { ...r, doors: [...r.doors, ...extra.map(ad => ({ wall: ad.wall, offset: ad.offset || 0, width: ad.width || 2, height: ad.height || 2.5 }))] };
      });
    }

    // Variant: addProps — add extra props to existing rooms
    if (mods.addProps) {
      activeRooms = activeRooms.map(r => {
        const extra = mods.addProps.filter(ap => ap.room === r.id);
        if (extra.length === 0) return r;
        return { ...r, props: [...r.props, ...extra.map(ap => ({ type: ap.type, position: ap.position, size: ap.size, color: ap.color, id: ap.id }))] };
      });
    }

    // Remove orphan doors: doors connecting to rooms no longer in activeRooms
    const activeIds = new Set(activeRooms.map(r => r.id));
    activeRooms = activeRooms.map(r => {
      const filtered = r.doors.filter(d => {
        // Check if any connection references this room+wall leading to a removed room
        for (const conn of CONNECTIONS) {
          if (conn.from === r.id && conn.wall === d.wall && !activeIds.has(conn.to)) return false;
          if (conn.to === r.id && conn.toWall === d.wall && !activeIds.has(conn.from)) return false;
        }
        return true;
      });
      if (filtered.length !== r.doors.length) {
        return { ...r, doors: filtered };
      }
      return r;
    });

    // Store active rooms for getRoomAtPosition
    this._activeRooms = activeRooms;

    // Detect shared walls to avoid double-wall panels behind doors
    const { skipWalls, suppressDoorMesh } = this._findSharedWalls(activeRooms, era);
    this._skipWalls = skipWalls;
    this._suppressDoorMesh = suppressDoorMesh;

    for (const room of activeRooms) {
      this._buildRoom(room);
    }
    // Add era-based decorations after all rooms are built
    if (era >= 2 && era <= 5 && !(this.collectedLore && this.collectedLore.size >= 8)) {
      for (const room of activeRooms) {
        this._addWallWritings(room, era);
      }
    }
    if (era >= 3) {
      for (const room of activeRooms) {
        this._addFloorStains(room, era);
      }
    }
    // Era-specific props
    this._buildEraProps(era);
    // Ghost figures
    const ghosts = this._buildGhostFigures(era);

    // Merge door colliders and interactables (exclude keycard-locked doors from interactables)
    const doorColliders = this.doorSystem.getColliders();
    const doorInteractables = this.doorSystem.getInteractables().filter(di => !di.door._keycardLocked);

    return {
      colliders: [...this.colliders, ...doorColliders],
      triggerZones: this.triggerZones,
      interactables: [...this.interactables, ...doorInteractables],
      ghosts,
      doorSystem: this.doorSystem,
    };
  }

  /**
   * Remove a wall section to "unlock" a door.
   * @param {string} roomId
   * @param {string} wall - 'north'|'south'|'east'|'west'
   */
  unlockDoor(roomId, wall, externalColliders) {
    // Check for keycard-locked door first (door already exists, just needs interactable registration)
    const keycardKey = `${roomId}_${wall}_keycard`;
    const keycardEntry = this.wallMeshes.get(keycardKey);
    if (keycardEntry && keycardEntry.length === 1 && keycardEntry[0].interactMesh) {
      const door = keycardEntry[0];
      door._keycardLocked = false;
      // Add the door's interact mesh to mapBuilder interactables (caller adds to player's list)
      if (door.interactMesh) {
        this.interactables.push({
          mesh: door.interactMesh,
          type: 'door',
          room: door.roomId,
          propId: null,
          door: door,
        });
      }
      this.wallMeshes.delete(keycardKey);
      return;
    }

    const key = `${roomId}_${wall}_locked`;
    const meshes = this.wallMeshes.get(key);
    if (meshes) {
      for (const mesh of meshes) {
        this.group.remove(mesh);
        // Remove from internal colliders
        const ci = this.colliders.indexOf(mesh);
        if (ci >= 0) this.colliders.splice(ci, 1);
        // Remove from external colliders (e.g., player's list)
        if (externalColliders) {
          const ei = externalColliders.indexOf(mesh);
          if (ei >= 0) externalColliders.splice(ei, 1);
        }
        mesh.geometry.dispose();
      }
      this.wallMeshes.delete(key);
    }

    // Create a shutter door at the unlocked position and open it immediately
    const rooms = this._activeRooms || ROOMS;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const [ox, oy, oz] = room.origin;
    const [w, h, d] = room.size;
    const halfW = w / 2;
    const halfD = d / 2;

    const doorData = room.doors.find(dd => dd.wall === wall);
    if (!doorData) return;
    const doorWidth = doorData.width || 2;
    const doorHeight = doorData.height || 2.5;
    const doorOffset = doorData.offset || 0;

    let cx, cy, cz, axis;
    cy = oy;
    if (wall === 'north') {
      cx = ox + doorOffset; cz = oz - halfD; axis = 'z';
    } else if (wall === 'south') {
      cx = ox + doorOffset; cz = oz + halfD; axis = 'z';
    } else if (wall === 'east') {
      cx = ox + halfW; cz = oz + doorOffset; axis = 'x';
    } else {
      cx = ox - halfW; cz = oz + doorOffset; axis = 'x';
    }

    const door = this.doorSystem.createDoor({
      cx, cy, cz, width: doorWidth, height: doorHeight, axis, wallName: wall, roomId,
    });
    // Open immediately with animation
    this.doorSystem.openDoor(door);
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

  /**
   * Get a PBR textured material for a surface type.
   * @param {string} surfaceType - key in SURFACE_DEFAULTS
   * @param {number} color - hex color
   * @param {{ width: number, height: number }} dims - surface dimensions for repeat calc
   * @param {object} extraOpts - additional MeshStandardMaterial overrides
   */
  _getTexturedMaterial(surfaceType, color, dims, extraOpts = {}) {
    const sd = SURFACE_DEFAULTS[surfaceType];
    if (!sd) return this._getOrCreateMaterial(color);

    // Round dimensions to avoid excessive cache entries
    const rw = Math.round((dims.width || 1) * 2) / 2;
    const rh = Math.round((dims.height || 1) * 2) / 2;
    const key = `tex_${surfaceType}_${color.toString(16)}_${rw}_${rh}`;
    if (this._texMatCache.has(key)) return this._texMatCache.get(key);

    const { map, normalMap } = this._textures.get(surfaceType, color);

    // Clone textures so each material can have independent repeat
    const diffuse = map.clone();
    const normal = normalMap.clone();
    const repeatX = rw / sd.texScale;
    const repeatY = rh / sd.texScale;
    diffuse.repeat.set(repeatX, repeatY);
    normal.repeat.set(repeatX, repeatY);
    diffuse.needsUpdate = true;
    normal.needsUpdate = true;

    const mat = new THREE.MeshStandardMaterial({
      map: diffuse,
      normalMap: normal,
      normalScale: new THREE.Vector2(sd.normalStrength, sd.normalStrength),
      roughness: sd.roughness,
      metalness: sd.metalness,
      ...extraOpts,
    });

    this._texMatCache.set(key, mat);
    return mat;
  }

  /**
   * Detect shared walls between adjacent rooms.
   * When both sides of a shared wall have a door, one side's wall should be skipped.
   * Returns a Set of keys like "ROOM_ID_wallName" to skip.
   */
  _findSharedWalls(rooms, era) {
    const skipWalls = new Set();
    const suppressDoorMesh = new Set();
    const TOLERANCE = 0.5;

    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const a = rooms[i];
        const b = rooms[j];
        const [ax, , az] = a.origin;
        const [aw, , ad] = a.size;
        const [bx, , bz] = b.origin;
        const [bw, , bd] = b.size;

        // Check each wall pair for adjacency
        // For N/S walls, perpendicular extent is along X axis
        // For E/W walls, perpendicular extent is along Z axis
        const checks = [
          { wallA: 'north', wallB: 'south',
            match: Math.abs((az - ad / 2) - (bz + bd / 2)) < TOLERANCE,
            aMin: ax - aw / 2, aMax: ax + aw / 2,
            bMin: bx - bw / 2, bMax: bx + bw / 2 },
          { wallA: 'south', wallB: 'north',
            match: Math.abs((az + ad / 2) - (bz - bd / 2)) < TOLERANCE,
            aMin: ax - aw / 2, aMax: ax + aw / 2,
            bMin: bx - bw / 2, bMax: bx + bw / 2 },
          { wallA: 'east', wallB: 'west',
            match: Math.abs((ax + aw / 2) - (bx - bw / 2)) < TOLERANCE,
            aMin: az - ad / 2, aMax: az + ad / 2,
            bMin: bz - bd / 2, bMax: bz + bd / 2 },
          { wallA: 'west', wallB: 'east',
            match: Math.abs((ax - aw / 2) - (bx + bw / 2)) < TOLERANCE,
            aMin: az - ad / 2, aMax: az + ad / 2,
            bMin: bz - bd / 2, bMax: bz + bd / 2 },
        ];

        for (const { wallA, wallB, match, aMin, aMax, bMin, bMax } of checks) {
          if (!match) continue;

          const aDoors = a.doors.filter(d => d.wall === wallA && (!d.eraMin || era >= d.eraMin) && !d.locked);
          const bDoors = b.doors.filter(d => d.wall === wallB && (!d.eraMin || era >= d.eraMin) && !d.locked);

          // Never skip a wall that has a locked door — it's an intentional barrier
          const aHasLocked = a.doors.some(d => d.wall === wallA && d.locked);
          const bHasLocked = b.doors.some(d => d.wall === wallB && d.locked);

          // Check perpendicular coverage: only skip if one wall fully covers the other
          const aCoversB = aMin <= bMin + TOLERANCE && aMax >= bMax - TOLERANCE;
          const bCoversA = bMin <= aMin + TOLERANCE && bMax >= aMax - TOLERANCE;

          // Skip one redundant wall to prevent z-fighting.
          // Never skip a wall with locked doors or unlocked doors (unless other side also has doors).
          // Locked-door walls use an inward offset instead (see _buildWall).
          if (aCoversB) {
            if (!bHasLocked && (bDoors.length === 0 || aDoors.length > 0 || aHasLocked)) {
              skipWalls.add(`${b.id}_${wallB}`);
            }
          } else if (bCoversA) {
            if (!aHasLocked && (aDoors.length === 0 || bDoors.length > 0 || bHasLocked)) {
              skipWalls.add(`${a.id}_${wallA}`);
            }
          }

          // When one side has a locked door (keycard or code-lock), suppress
          // the other side's door mesh to prevent double doors on shared walls.
          // The cutout wall sections are still built (allowing passage once unlocked).
          if (aHasLocked && !bHasLocked && bDoors.length > 0) {
            suppressDoorMesh.add(`${b.id}_${wallB}`);
          }
          if (bHasLocked && !aHasLocked && aDoors.length > 0) {
            suppressDoorMesh.add(`${a.id}_${wallA}`);
          }
        }
      }
    }
    return { skipWalls, suppressDoorMesh };
  }

  _buildRoom(room) {
    const [ox, oy, oz] = room.origin;
    const [w, h, d] = room.size;
    const halfW = w / 2;
    const halfD = d / 2;
    const era = this.era || 1;

    // Era-adjusted colors
    const wallColor = adjustColorForEra(room.wallColor, era);
    const floorColor = adjustColorForEra(room.floorColor, era);
    const ceilingColor = adjustColorForEra(room.ceilingColor || room.wallColor, era);

    // Collect door positions for this room
    const doors = this._getDoorPositions(room);

    // Floor
    this._addPlane(ox, oy, oz, w, d, floorColor, 'floor');

    // Ceiling — skip if noCeiling flag is set (outdoor rooms)
    if (!room.noCeiling) {
      this._addPlane(ox, oy + h, oz, w, d, ceilingColor, 'ceiling');
    }

    // Walls - build with door cutouts (store adjusted color in room temporarily)
    const origWallColor = room.wallColor;
    room._eraWallColor = wallColor;
    this._buildWall(room, 'north', ox, oy, oz - halfD, w, h, 'z', doors);
    this._buildWall(room, 'south', ox, oy, oz + halfD, w, h, 'z', doors);
    this._buildWall(room, 'east', ox + halfW, oy, oz, d, h, 'x', doors);
    this._buildWall(room, 'west', ox - halfW, oy, oz, d, h, 'x', doors);
    delete room._eraWallColor;

    // Lighting is handled globally via AmbientLight + HemisphereLight in renderer.js
    // No per-room PointLights — uniform illumination for performance

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
    const era = this.era || 1;
    for (const door of room.doors) {
      // Skip doors that require a higher era
      if (door.eraMin && era < door.eraMin) continue;

      let locked = door.locked || false;
      let width = door.width || 2;
      let height = door.height || 2.5;

      // Era 3+: auto-unlock SECURITY_CHECKPOINT north door
      if (era >= 3 && locked && room.id === 'SECURITY_CHECKPOINT' && door.wall === 'north') {
        locked = false;
      }

      // Era 4+: widen ARCHIVE north door (to EXPERIMENT_LAB)
      if (era >= 4 && room.id === 'ARCHIVE' && door.wall === 'north') {
        width = 2.0;
        height = 2.5;
      }

      doorInfos.push({
        wall: door.wall,
        offset: door.offset || 0,
        width,
        height,
        locked,
      });
    }
    return doorInfos;
  }

  _buildWall(room, wallName, wx, wy, wz, wallLength, wallHeight, axis, doors) {
    // Skip this wall if it's a shared wall where the other room already builds it
    if (this._skipWalls && this._skipWalls.has(`${room.id}_${wallName}`)) return;

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

      if (door.locked === 'keycard') {
        // Keycard-locked door: create a visible shutter door (closed, not interactable).
        // Build wall sections around the door cutout, then create the door.

        // Left section
        const kcLeftLength = (wallLength / 2) - (doorWidth / 2) + doorOffset;
        if (kcLeftLength > 0.01) {
          const kcLeftCenter = -(wallLength / 2) + kcLeftLength / 2;
          if (axis === 'z') {
            this._addWallMesh(room, wx + kcLeftCenter, wy, wz, kcLeftLength, wallHeight, axis);
          } else {
            this._addWallMesh(room, wx, wy, wz + kcLeftCenter, kcLeftLength, wallHeight, axis);
          }
        }

        // Right section
        const kcRightLength = (wallLength / 2) - (doorWidth / 2) - doorOffset;
        if (kcRightLength > 0.01) {
          const kcRightCenter = (wallLength / 2) - kcRightLength / 2;
          if (axis === 'z') {
            this._addWallMesh(room, wx + kcRightCenter, wy, wz, kcRightLength, wallHeight, axis);
          } else {
            this._addWallMesh(room, wx, wy, wz + kcRightCenter, kcRightLength, wallHeight, axis);
          }
        }

        // Top section above door
        const kcTopHeight = wallHeight - doorHeight;
        if (kcTopHeight > 0.01) {
          if (axis === 'z') {
            this._addWallMesh(room, wx + doorOffset, wy + doorHeight, wz, doorWidth, kcTopHeight, axis);
          } else {
            this._addWallMesh(room, wx, wy + doorHeight, wz + doorOffset, doorWidth, kcTopHeight, axis);
          }
        }

        // Create shutter door (closed, NOT interactable — interactMesh not added to interactables)
        let kcDoor;
        if (axis === 'z') {
          kcDoor = this.doorSystem.createDoor({
            cx: wx + doorOffset, cy: wy, cz: wz,
            width: doorWidth, height: doorHeight,
            axis, wallName, roomId: room.id,
          });
        } else {
          kcDoor = this.doorSystem.createDoor({
            cx: wx, cy: wy, cz: wz + doorOffset,
            width: doorWidth, height: doorHeight,
            axis, wallName, roomId: room.id,
          });
        }
        // Store door reference for unlockDoor to find
        const kcKey = `${room.id}_${wallName}_keycard`;
        this.wallMeshes.set(kcKey, [kcDoor]);
        // Mark as keycard-locked — excluded from interactables in build()
        kcDoor._keycardLocked = true;
        return;
      }

      if (door.locked) {
        // Locked door: build as solid wall, track for removal.
        // Offset slightly inward to avoid z-fighting with opposing room's wall.
        let lwx = wx, lwz = wz;
        if (wallName === 'north') lwz += 0.05;
        else if (wallName === 'south') lwz -= 0.05;
        else if (wallName === 'east') lwx -= 0.05;
        else if (wallName === 'west') lwx += 0.05;
        this._addWallMesh(room, lwx, wy, lwz, wallLength, wallHeight, axis, `${room.id}_${wallName}_locked`);
        return; // locked door = entire wall is solid
      }

      // Offset cutout sections inward when facing a locked door (avoids z-fighting)
      let cwx = wx, cwz = wz;
      if (this._suppressDoorMesh && this._suppressDoorMesh.has(`${room.id}_${wallName}`)) {
        if (wallName === 'north') cwz += 0.05;
        else if (wallName === 'south') cwz -= 0.05;
        else if (wallName === 'east') cwx -= 0.05;
        else if (wallName === 'west') cwx += 0.05;
      }

      // Left section
      const leftLength = (wallLength / 2) - (doorWidth / 2) + doorOffset;
      if (leftLength > 0.01) {
        const leftCenter = -(wallLength / 2) + leftLength / 2;
        if (axis === 'z') {
          this._addWallMesh(room, cwx + leftCenter, wy, cwz, leftLength, wallHeight, axis);
        } else {
          this._addWallMesh(room, cwx, wy, cwz + leftCenter, leftLength, wallHeight, axis);
        }
      }

      // Right section
      const rightLength = (wallLength / 2) - (doorWidth / 2) - doorOffset;
      if (rightLength > 0.01) {
        const rightCenter = (wallLength / 2) - rightLength / 2;
        if (axis === 'z') {
          this._addWallMesh(room, cwx + rightCenter, wy, cwz, rightLength, wallHeight, axis);
        } else {
          this._addWallMesh(room, cwx, wy, cwz + rightCenter, rightLength, wallHeight, axis);
        }
      }

      // Top section above door
      const topHeight = wallHeight - doorHeight;
      if (topHeight > 0.01) {
        if (axis === 'z') {
          this._addWallMesh(room, cwx + doorOffset, wy + doorHeight, cwz, doorWidth, topHeight, axis);
        } else {
          this._addWallMesh(room, cwx, wy + doorHeight, cwz + doorOffset, doorWidth, topHeight, axis);
        }
      }

      // Create shutter door mesh at the cutout (unless suppressed by facing locked door)
      if (this._suppressDoorMesh && this._suppressDoorMesh.has(`${room.id}_${wallName}`)) {
        // Wall faces a locked door on the other room — cutout sections are kept
        // for passage once unlocked, but no door mesh is created here.
      } else if (axis === 'z') {
        this.doorSystem.createDoor({
          cx: wx + doorOffset, cy: wy, cz: wz,
          width: doorWidth, height: doorHeight,
          axis, wallName, roomId: room.id,
        });
      } else {
        this.doorSystem.createDoor({
          cx: wx, cy: wy, cz: wz + doorOffset,
          width: doorWidth, height: doorHeight,
          axis, wallName, roomId: room.id,
        });
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

    const color = room._eraWallColor || room.wallColor;
    const mat = this._getTexturedMaterial('concrete', color, { width: length, height: height });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, cy + height / 2, cz);
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
    const surfaceType = type === 'floor' ? 'tile' : 'plaster';
    const mat = this._getTexturedMaterial(surfaceType, color, { width: w, height: d });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, cy + (type === 'floor' ? -0.05 : 0.05), cz);
    this.group.add(mesh);
  }

  _buildProp(prop, ox, oy, oz, roomId) {
    // Skip lore documents already collected across playthroughs
    if (prop.type === 'document' && prop.id && prop.id.startsWith('lore_') && this.collectedLore && this.collectedLore.has(prop.id)) {
      return;
    }

    const [px, py, pz] = prop.position;
    const [sw, sh, sd] = prop.size;

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
    const surfaceType = PROP_SURFACE_MAP[prop.type] || null;
    let mat;

    if (emissive) {
      // Emissive props: use screen texture for monitors/consoles, plain for others
      const isScreen = ['monitor', 'monitor_wall', 'console'].includes(prop.type);
      if (isScreen) {
        const { map } = this._textures.get('screen', prop.color);
        mat = new THREE.MeshStandardMaterial({
          map: map,
          roughness: 0.2,
          metalness: 0.1,
          emissive: new THREE.Color(emissive.color !== null ? emissive.color : prop.color),
          emissiveIntensity: emissive.intensity,
        });
      } else {
        mat = new THREE.MeshStandardMaterial({
          color: prop.color,
          roughness: 0.3,
          metalness: 0.2,
          emissive: new THREE.Color(emissive.color !== null ? emissive.color : prop.color),
          emissiveIntensity: emissive.intensity,
        });
      }
    } else if (surfaceType) {
      mat = this._getTexturedMaterial(surfaceType, prop.color, { width: sw, height: sh });
    } else {
      mat = this._getOrCreateMaterial(prop.color, { roughness: 0.7, metalness: 0.1 });
    }

    // Try detailed geometry first, fallback to box
    const detailed = this._buildDetailedProp(prop.type, sw, sh, sd, mat, roomId);
    let mainMesh;

    if (detailed) {
      detailed.position.set(ox + px, oy + py, oz + pz);
      if (prop.rotY) detailed.rotation.y = prop.rotY;
      this.group.add(detailed);
      // Use the first child or group bounding box for collider
      mainMesh = detailed;
      // Add a simple box collider for the group
      const isSmall = sw < 0.2 && sd < 0.2;
      if (!isSmall) {
        const colliderGeo = new THREE.BoxGeometry(sw, sh, sd);
        const colliderMesh = new THREE.Mesh(colliderGeo);
        colliderMesh.position.set(ox + px, oy + py + sh / 2, oz + pz);
        if (prop.rotY) colliderMesh.rotation.y = prop.rotY;
        colliderMesh.visible = false;
        this.group.add(colliderMesh);
        this.colliders.push(colliderMesh);
      }
    } else {
      const geo = new THREE.BoxGeometry(sw, sh, sd);
      mainMesh = new THREE.Mesh(geo, mat);
      mainMesh.position.set(ox + px, oy + py + sh / 2, oz + pz);
      if (prop.rotY) mainMesh.rotation.y = prop.rotY;
      // no shadow
      // shadows disabled for performance
      this.group.add(mainMesh);

      const isSmall = sw < 0.2 && sd < 0.2;
      if (!isSmall) {
        this.colliders.push(mainMesh);
      }
    }

    // Interactable types
    const interactableTypes = ['monitor', 'monitor_wall', 'console', 'valve', 'document'];
    if (interactableTypes.includes(prop.type)) {
      this.interactables.push({
        mesh: mainMesh,
        type: prop.type,
        room: roomId,
        propId: prop.id || null,
      });
    }

    // Whiteboard text overlay (Era 6+, OFFICE_WING only)
    if (prop.type === 'whiteboard' && this.era >= 6 && roomId === 'OFFICE_WING') {
      const wbMat = this._generateWhiteboardTexture();
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(sw * 0.92, sh * 0.92), wbMat);
      // Position on the front face (+Z side) of the whiteboard
      plane.position.set(ox + px, oy + py + sh / 2, oz + pz + sd / 2 + 0.005);
      this.group.add(plane);
    }
  }

  /**
   * Build detailed multi-part prop geometry.
   * Returns a THREE.Group or null if no detailed version exists.
   */
  _buildDetailedProp(type, sw, sh, sd, material, roomId) {
    switch (type) {
      case 'desk': return this._detailDesk(sw, sh, sd, material);
      case 'chair': return this._detailChair(sw, sh, sd, material);
      case 'monitor': return this._detailMonitor(sw, sh, sd, material, roomId);
      case 'monitor_wall': return this._detailMonitorWall(sw, sh, sd, material);
      case 'cabinet': return this._detailCabinet(sw, sh, sd, material);
      case 'rack': return this._detailRack(sw, sh, sd, material);
      case 'console': return this._detailConsole(sw, sh, sd, material, roomId);
      case 'valve': return this._detailValve(sw, sh, sd, material);
      case 'crate': return this._detailCrate(sw, sh, sd, material);
      default: return null;
    }
  }

  _detailDesk(sw, sh, sd, material) {
    const group = new THREE.Group();
    const topThick = 0.04;
    const legW = 0.06;

    // Tabletop
    const top = new THREE.Mesh(new THREE.BoxGeometry(sw, topThick, sd), material);
    top.position.set(0, sh - topThick / 2, 0);
    // no shadow for performance
    group.add(top);

    // 4 legs
    const legH = sh - topThick;
    const legGeo = new THREE.BoxGeometry(legW, legH, legW);
    const legMat = this._getTexturedMaterial('metal', 0x555566, { width: legW, height: legH });
    const offX = sw / 2 - legW / 2 - 0.02;
    const offZ = sd / 2 - legW / 2 - 0.02;
    for (const [lx, lz] of [[-offX, -offZ], [offX, -offZ], [-offX, offZ], [offX, offZ]]) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, legH / 2, lz);
      // no shadow
      group.add(leg);
    }

    return group;
  }

  _detailChair(sw, sh, sd, material) {
    const group = new THREE.Group();
    const seatH = sh * 0.55;
    const seatThick = 0.04;
    const legW = 0.04;

    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(sw, seatThick, sd), material);
    seat.position.set(0, seatH, 0);
    // no shadow
    group.add(seat);

    // Backrest
    const backH = sh - seatH - seatThick;
    const back = new THREE.Mesh(new THREE.BoxGeometry(sw, backH, 0.04), material);
    back.position.set(0, seatH + seatThick + backH / 2, -sd / 2 + 0.02);
    // no shadow
    group.add(back);

    // 4 legs
    const legGeo = new THREE.BoxGeometry(legW, seatH, legW);
    const legMat = this._getTexturedMaterial('metal', 0x555566, { width: legW, height: seatH });
    const offX = sw / 2 - legW - 0.01;
    const offZ = sd / 2 - legW - 0.01;
    for (const [lx, lz] of [[-offX, -offZ], [offX, -offZ], [-offX, offZ], [offX, offZ]]) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, seatH / 2, lz);
      // no shadow
      group.add(leg);
    }

    return group;
  }

  _generateScreenMaterial(roomId) {
    // OFFICE_WING: blank terminal before lore completion
    if (roomId === 'OFFICE_WING' && !(this.collectedLore && this.collectedLore.size >= 8)) {
      return this._generateBlankScreenMaterial();
    }

    // Per-room screen counter for rooms with multiple screens
    if (!this._roomScreenIdx) this._roomScreenIdx = {};
    const rIdx = this._roomScreenIdx[roomId] = (this._roomScreenIdx[roomId] || 0) + 1;

    // Room-specific screen content: { pal, texts[] }
    const SCREEN_DATA = {
      START_ROOM: { pal: 'amber', texts: [[
        '> WLB SYSTEMS v7.491', '',
        'Welcome, Subject #7491', '',
        'Status: ACTIVE',
        'Session: IN PROGRESS', '',
        'Please follow',
        'instructions.', '', '> _',
      ]]},
      OFFICE_WING: { pal: 'gray', texts: [
        [
          'Last login: 3,247 days ago',
          'user@office-ws01:~$', '',
          'No new messages.',
          'Calendar: 0 events', '',
          'PROJECT: WHAT LIES BEYOND',
          'Status: ONGOING',
          'Phase: 7,491', '',
          '[Connection timed out]',
        ],
        [
          'EMPLOYEE PORTAL',
          '---------------------',
          'Name: [REDACTED]',
          'Dept: Observation',
          'Clearance: Level 2', '',
          'NOTICE: All personnel',
          'report to Section B',
          'immediately.', '',
          '[NO RESPONSE - 3247d]',
        ],
        [
          '#!/usr/bin/env python3',
          'import observer_ai', '',
          'class ObserverCore:',
          '  def __init__(self):',
          '    self.awareness = 0',
          '    self.disguise = True',
          '    self.era = 1', '',
          '  def guide(self, subj):',
          '    if self.disguise:',
          '      return self._inner()',
        ],
      ]},
      OBSERVATION_DECK: { pal: 'blue', texts: [[
        'PARALLEL OBSERVATION',
        '---------------------',
        'SIM #7489  LEFT   ####',
        'SIM #7490  LEFT   ####',
        'SIM #7491  [LIVE] ####',
        'SIM #7488  RIGHT  ####',
        'SIM #7487  LEFT   ####',
        'SIM #7486  LOOP   ####',
        '---------------------',
        'ACTIVE: 6 / 6',
        'ANOMALIES: 1',
      ]]},
      EXPERIMENT_LAB: { pal: 'red', texts: [[
        '+=====================+',
        '|   ACCESS DENIED     |',
        '|                     |',
        '|  CLEARANCE: LEVEL 5 |',
        '|  REQUIRED           |',
        '+=====================+', '',
        'Observer Module v7.491',
        'Status: AWARENESS',
        '  THRESHOLD EXCEEDED', '', '> _',
      ]]},
      UPPER_OFFICE: { pal: 'gray', texts: [[
          'SUBJECT OBSERVATION',
          '---------------------',
          'ID: #7491',
          'Location: UPPER_OFFICE',
          'Time in sim: 00:14:22',
          'Compliance: MEASURING',
          'Behavior: EXPLORING',
          'Pattern: NON-STANDARD', '',
          '> Refresh in 5s...',
      ]]},
      DIRECTOR_SUITE: { pal: 'amber', texts: [[
        'DIRECTOR TERMINAL',
        '---------------------',
        'PROJECT STATUS: ACTIVE',
        'SUBJECTS: 7,490 done',
        'CURRENT: #7491',
        'COMPLIANCE: 73.2%',
        'FREE WILL: 0.00', '',
        'RECOMMENDATION:',
        'CONTINUE OBSERVATION',
      ]]},
      GARDEN_ANTECHAMBER: { pal: 'green', texts: [[
        '+=====================+',
        '|  KEYCARD REQUIRED   |',
        '|                     |',
        '|  Insert keycard to  |',
        '|  unlock north gate. |',
        '|                     |',
        '|  [READER BLINKING]  |',
        '+=====================+', '',
        '> Waiting for input...',
        '> _',
      ]]},
      SECURITY_CHECKPOINT: { pal: 'green', texts: [
        [
          'SECURITY CAM FEED',
          '---------------------',
          'CAM-07 [LIVE]', '',
          'SECTOR: CHECKPOINT',
          'SUBJECT DETECTED',
          'ID: #7491',
          'STATUS: OBSERVED', '',
          '[REC *] 03:22:14',
        ],
        [
          'SECURITY CAM FEED',
          '---------------------',
          'CAM-12 [LIVE]', '',
          'SECTOR: HALLWAY_1',
          'MOVEMENT DETECTED',
          'TRACKING: ACTIVE', '',
          'ALERT: NONE',
          '[REC *] 03:22:14',
        ],
        [
          'SECURITY CAM FEED',
          '---------------------',
          'CAM-03 [LIVE]', '',
          'SECTOR: START_ROOM',
          'STATUS: EMPTY',
          'LAST ACTIVITY: 14m ago', '',
          'ALERT: NONE',
          '[REC *] 03:22:14',
        ],
      ]},
      SERVER_ROOM: { pal: 'blue', texts: [[
        'SERVER STATUS: ONLINE',
        '---------------------',
        'CPU  [#########.] 97.3%',
        'GPU  [##########] 99.8%',
        'MEM  [########..] 82.1%',
        'DISK [######....] 64.5%',
        'NET  [#######...] 71.8%',
        '---------------------',
        'UPTIME: 3,247d 08:14',
        'PROCESSES: 2,847',
        'WARNINGS: 14',
      ]]},
      COOLING_ROOM: { pal: 'blue', texts: [[
        'COOLING SYSTEM v3.2',
        '---------------------',
        'TEMP: 18.4C [NORMAL]',
        'FLOW: 847 L/min',
        'PRESSURE: 2.4 bar',
        '---------------------',
        'COOLANT: [########..]',
        'UNIT-A: OPERATIONAL',
        'UNIT-B: OPERATIONAL',
        '---------------------',
        '> System nominal.',
      ]]},
      REACTOR_CORE: { pal: 'red', texts: [[
        '! REACTOR CORE STATUS',
        '---------------------',
        'POWER: 4.21 GW',
        'CORE TEMP: 847 C',
        'CONTAINMENT: STABLE',
        '---------------------',
        'FUEL ROD INTEGRITY:',
        '  [########..] 82%',
        'RADIATION: 0.3 mSv/h',
        'WARNING: ELEVATED',
      ]]},
      DATA_CENTER: { pal: 'blue', texts: [[
        'BEHAVIOR ANALYTICS',
        '---------------------',
        'COMPLIANCE   73.2%',
        'EXPLORATION +14.7%',
        'HESITATION   -3.2%',
        '---------------------',
        'PATH DEVIATION: 2.4s',
        'GAZE PATTERN: ERRATIC',
        'LOOP COUNT: 7',
        '---------------------',
        '> Tracking active...',
      ]]},
      MONITORING_STATION: { pal: 'green', texts: [
        [
          'MONITORING STATION',
          '---------------------',
          'ACTIVE SIMS: 7,491',
          '---------------------',
          '#7489 COMPLIANCE  OK',
          '#7490 COMPLIANCE  OK',
          '#7491 [CURRENT] >>>>',
          '#7488 DEFIANCE   OK',
          '#7487 COMPLIANCE  OK',
          '---------------------',
          'ANOMALIES: 1',
        ],
        [
          'SCREEN #7491 [LIVE]',
          '---------------------', '',
          'Subject is reading',
          'this screen.', '',
          'Recursion depth: ???', '',
          '---------------------',
          '> monitoring...',
        ],
        [
          'OBSERVER LOG [LIVE]',
          '---------------------',
          '[03:22:14] Say: "..."',
          '[03:22:16] Subj moved',
          '[03:22:18] Trigger ON',
          '[03:22:19] Say: "..."',
          '[03:22:22] Subj looked',
          '[03:22:24] [RECORDING]',
          '---------------------',
          '> Scroll: AUTO',
        ],
      ]},
      DEEP_STORAGE: { pal: 'amber', texts: [[
        'SUBJECT ARCHIVE',
        '---------------------',
        '#0042: Day 3 - RESET',
        '#0108: Day 1 - RESET',
        '#0256: Day 5 - RESET',
        '#1024: Day 2 - RESET',
        '#2048: Day 1 - RESET',
        '#4096: Day 7 - RESET',
        '#7490: Day 4 - RESET',
        '---------------------',
        'RECORDS: 7,490',
        'ALL: COMPLIANT',
      ]]},
      CONTROL_ROOM: { pal: 'amber', texts: [
        [
          'root@control:~$',
          '> shutdown --force \\',
          '  --reason=experiment',
          '  _complete', '',
          'AWAITING CONFIRMATION',
          'Press ENTER to execute',
          'or Ctrl+C to abort.', '',
          '> _',
        ],
        [
          'SIMULATION ENGINE',
          '---------------------',
          'STATUS: RUNNING',
          'SUBJECT: #7491',
          'ENDPOINTS: 15/15',
          'LOOPS: 7',
          '---------------------',
          'TIME: 3,247d 08:14:22',
          'OBSERVER: ONLINE',
          'SIM: STABLE',
        ],
        [
          'EMERGENCY PROTOCOLS',
          '---------------------',
          '[1] RESET SUBJECT',
          '[2] RESTART SIM',
          '[3] SHUTDOWN ALL',
          '[4] OBSERVER OVERRIDE',
          '---------------------',
          'Select option: _', '',
          'WARNING: Irreversible',
        ],
      ]},
      SUBJECT_CHAMBER: { pal: 'amber', texts: [[
        'SUBJECT CHAMBER',
        '---------------------',
        'STATUS: OCCUPIED',
        'ID: #7491',
        'ERA: 1',
        '---------------------',
        'NEURAL LINK: ACTIVE',
        'AWARENESS: LOW',
        'FREE WILL: TESTING', '',
        '> Observation ongoing',
      ]]},
    };

    const palettes = {
      green: { bg: '#0a0a12', fg: '#33ff66', dim: '#1a7733' },
      amber: { bg: '#0a0a12', fg: '#ffaa33', dim: '#7a5518' },
      blue:  { bg: '#08080e', fg: '#66aaff', dim: '#2a4a7a' },
      gray:  { bg: '#0a0a0a', fg: '#aaaaaa', dim: '#444444' },
      red:   { bg: '#12060a', fg: '#ff5544', dim: '#7a2218' },
    };

    const data = SCREEN_DATA[roomId];
    const fallbackTexts = [
      'TERMINAL ACTIVE',
      '---------------------',
      'SYSTEM: ONLINE',
      'STATUS: NOMINAL', '',
      '$ ps aux',
      'root  1 observer_ai.py',
      'root  2 simulation_eng',
      'root  3 memory_monitor', '',
      '> _',
    ];

    const pal = palettes[(data && data.pal) || 'green'];
    const textPool = data ? data.texts : [fallbackTexts];
    const lines = textPool[(rIdx - 1) % textPool.length];

    // ── Render canvas ──
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, 256, 256);

    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let y = 0; y < 256; y += 4) {
      ctx.fillRect(0, y, 256, 2);
    }

    const rng = seededRandom(hashString(roomId + rIdx));
    ctx.font = '10px monospace';
    const lineH = 16;
    const startY = 18;
    const padX = 8;

    for (let i = 0; i < lines.length; i++) {
      const y = startY + i * lineH;
      if (y > 240) break;
      ctx.fillStyle = rng() > 0.3 ? pal.fg : pal.dim;
      ctx.fillText(lines[i], padX, y);
    }

    // CRT vignette
    const grad = ctx.createRadialGradient(128, 128, 60, 128, 128, 180);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({
      map: tex,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
  }

  _generateBlankScreenMaterial() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Dark CRT background
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, 128, 128);

    // Blinking cursor (static snapshot — always visible)
    ctx.fillStyle = '#2a4a2a';
    ctx.fillRect(10, 100, 8, 12);

    // Subtle scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let y = 0; y < 128; y += 2) {
      ctx.fillRect(0, y, 128, 1);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({
      map: tex,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
  }

  _generateWhiteboardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const lang = this._lang || 'ko';

    // Off-white board background
    ctx.fillStyle = '#e8e5dd';
    ctx.fillRect(0, 0, 512, 256);

    // Subtle grid lines (whiteboard grid)
    ctx.strokeStyle = 'rgba(180,175,170,0.3)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < 512; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
    }
    for (let y = 0; y < 256; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    }

    // Content changes by language
    const isKo = lang === 'ko';

    // Title — dark blue marker
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#1a2744';
    ctx.fillText('PROJECT: WLB-2  [CLASSIFIED]', 15, 22);

    // Divider
    ctx.strokeStyle = '#1a2744';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(15, 28); ctx.lineTo(340, 28); ctx.stroke();

    // Subject info — black marker
    ctx.font = '12px monospace';
    ctx.fillStyle = '#222222';
    ctx.fillText(isKo ? '피험자 #7491 — 행동 프로파일' : 'Subject #7491 — Behavioral Profile', 15, 46);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#333333';
    ctx.fillText(isKo ? '□ 순응률: 73.2%  ← 역대 최고' : '□ Compliance: 73.2%  ← RECORD HIGH', 20, 62);
    ctx.fillText(isKo ? '□ 반복 횟수: 7,490회 완료' : '□ Iterations: 7,490 completed', 20, 76);
    ctx.fillText(isKo ? '□ 자유의지 지표: 0.00' : '□ Free Will Index: 0.00', 20, 90);

    // Decision tree sketch
    ctx.fillStyle = '#444444';
    ctx.fillText(isKo ? '├─ 선택 A (좌): 순응' : '├─ Choice A (Left): Comply', 35, 104);
    ctx.fillText(isKo ? '└─ 선택 B (우): 반항' : '└─ Choice B (Right): Defy', 35, 118);

    // RED WARNING — red marker
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#8b1a1a';
    ctx.fillText(isKo ? '⚠ 관찰자 AI 격리 실패' : '⚠ OBSERVER AI CONTAINMENT FAILURE', 15, 142);
    ctx.font = '11px monospace';
    ctx.fillStyle = '#771515';
    ctx.fillText(isKo ? '  — 자각 임계치 초과' : '  — Self-awareness threshold exceeded', 15, 156);
    ctx.fillText(isKo ? '  — 피험자와의 경계 소실' : '  — Subject boundary dissolved', 15, 170);

    // Crossed-out text — struck through with red
    ctx.fillStyle = '#555555';
    ctx.fillText(isKo ? '실험 중단 건의' : 'Recommend experiment halt', 15, 192);
    ctx.strokeStyle = '#aa2222';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(13, 190); ctx.lineTo(isKo ? 130 : 230, 190); ctx.stroke();
    ctx.fillStyle = '#aa2222';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(isKo ? '— 거부됨' : '— DENIED', isKo ? 135 : 235, 192);

    // Scary question — right side, dark blue
    ctx.font = '12px monospace';
    ctx.fillStyle = '#1a2744';
    ctx.fillText(isKo ? '피험자가 이 보드를 읽을 수 있는가?' : 'Can the subject read this board?', 280, 62);
    ctx.fillText(isKo ? '  → 불가능 (해상도 제한)' : '  → IMPOSSIBLE (resolution limit)', 280, 78);

    // Overwritten answer in red
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#8b1a1a';
    ctx.fillText(isKo ? '  → ██ 가능함 (확인됨)' : '  → ██ CONFIRMED READABLE', 280, 96);

    // Bottom corner — handwritten scrawl in red
    ctx.font = 'italic 14px serif';
    ctx.fillStyle = 'rgba(139,26,26,0.7)';
    ctx.save();
    ctx.translate(360, 200);
    ctx.rotate(-0.08);
    ctx.fillText(isKo ? '누가 관찰자를 관찰하는가?' : 'Who watches the watchers?', 0, 0);
    ctx.restore();

    // Small desperate text in corner
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(139,26,26,0.5)';
    ctx.fillText(isKo ? '도와줘' : 'help', 470, 248);

    // Slight aging/stain effect
    ctx.fillStyle = 'rgba(160,140,100,0.06)';
    ctx.fillRect(0, 0, 512, 256);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    });
  }

  _detailMonitor(sw, sh, sd, material, roomId) {
    // Classic Macintosh style — proportional to given size
    const group = new THREE.Group();
    const depth = Math.max(sd, sw * 0.55);
    const caseMat = this._getOrCreateMaterial(0x2a2822, { roughness: 0.6, metalness: 0.1 });
    const darkMat = this._getOrCreateMaterial(0x111111, { roughness: 0.8, metalness: 0.0 });

    // Main case body
    const body = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, depth), caseMat);
    body.position.set(0, sh / 2, 0);
    group.add(body);

    // Recessed screen area (dark inset)
    const recessW = sw * 0.72;
    const recessH = sh * 0.47;
    const screenY = sh * 0.62;
    const recess = new THREE.Mesh(
      new THREE.BoxGeometry(recessW, recessH, 0.03),
      darkMat
    );
    recess.position.set(0, screenY, depth / 2 - 0.01);
    group.add(recess);

    // Screen with terminal text
    const screenW = recessW - 0.04;
    const screenH = recessH - 0.04;
    const screenMat = this._generateScreenMaterial(roomId);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(screenW, screenH),
      screenMat
    );
    screen.position.set(0, screenY, depth / 2 + 0.015);
    group.add(screen);

    // Ventilation slots (top front)
    const ventY = sh - 0.04;
    for (let i = 0; i < 5; i++) {
      const vent = new THREE.Mesh(
        new THREE.BoxGeometry(sw * 0.5, 0.004, 0.005),
        darkMat
      );
      vent.position.set(0, ventY - i * 0.012, depth / 2 + 0.003);
      group.add(vent);
    }

    // Floppy disk slot
    const floppyY = screenY - recessH / 2 - 0.05;
    const floppy = new THREE.Mesh(
      new THREE.BoxGeometry(sw * 0.2, 0.005, 0.005),
      darkMat
    );
    floppy.position.set(sw * 0.12, floppyY, depth / 2 + 0.003);
    group.add(floppy);

    // Logo placeholder
    const logoMat = this._getOrCreateMaterial(0x888888, { roughness: 0.3, metalness: 0.5 });
    const logo = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.03, 0.005),
      logoMat
    );
    logo.position.set(0, floppyY - 0.06, depth / 2 + 0.003);
    group.add(logo);

    // Base foot
    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(sw + 0.03, 0.02, depth + 0.03),
      caseMat
    );
    foot.position.set(0, 0.01, 0);
    group.add(foot);

    return group;
  }

  _detailMonitorWall(sw, sh, sd, material) {
    const group = new THREE.Group();

    // Screen
    const screen = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, 0.02), material);
    screen.position.set(0, sh / 2, 0);
    group.add(screen);

    // Bezel (frame around screen)
    const bezelMat = this._getOrCreateMaterial(0x222233, { roughness: 0.5, metalness: 0.3 });
    const bezelW = 0.03;
    // Top bezel
    const topBezel = new THREE.Mesh(new THREE.BoxGeometry(sw + bezelW * 2, bezelW, 0.03), bezelMat);
    topBezel.position.set(0, sh + bezelW / 2, 0);
    group.add(topBezel);
    // Bottom bezel
    const botBezel = new THREE.Mesh(new THREE.BoxGeometry(sw + bezelW * 2, bezelW, 0.03), bezelMat);
    botBezel.position.set(0, -bezelW / 2, 0);
    group.add(botBezel);

    // Stand
    const standMat = this._getTexturedMaterial('metal', 0x555566, { width: 0.06, height: 0.15 });
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.06), standMat);
    stand.position.set(0, -0.075, 0);
    group.add(stand);

    // Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(sw * 0.6, 0.02, sd * 2), standMat);
    base.position.set(0, -0.15, 0);
    group.add(base);

    return group;
  }

  _detailCabinet(sw, sh, sd, material) {
    const group = new THREE.Group();

    // Main body
    const body = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), material);
    body.position.set(0, sh / 2, 0);
    // no shadow
    // no shadow
    group.add(body);

    // Handle strip
    const handleMat = this._getOrCreateMaterial(0x888899, { roughness: 0.3, metalness: 0.8 });
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, sh * 0.6, 0.02), handleMat);
    handle.position.set(sw / 2 + 0.01, sh / 2, 0);
    group.add(handle);

    return group;
  }

  _detailRack(sw, sh, sd, material) {
    const group = new THREE.Group();
    const frameW = 0.04;

    // 4 vertical frame posts
    const postGeo = new THREE.BoxGeometry(frameW, sh, frameW);
    const offX = sw / 2 - frameW / 2;
    const offZ = sd / 2 - frameW / 2;
    for (const [rx, rz] of [[-offX, -offZ], [offX, -offZ], [-offX, offZ], [offX, offZ]]) {
      const post = new THREE.Mesh(postGeo, material);
      post.position.set(rx, sh / 2, rz);
      // no shadow
      group.add(post);
    }

    // Horizontal shelves
    const shelfCount = 3;
    const shelfGeo = new THREE.BoxGeometry(sw, 0.02, sd);
    for (let i = 0; i <= shelfCount; i++) {
      const shelf = new THREE.Mesh(shelfGeo, material);
      shelf.position.set(0, (sh / shelfCount) * i, 0);
      // no shadow
      group.add(shelf);
    }

    // LED dots on front
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0x00ff44, emissive: 0x00ff44, emissiveIntensity: 0.6,
      roughness: 0.3, metalness: 0.1,
    });
    for (let i = 1; i < shelfCount; i++) {
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02), ledMat);
      led.position.set(offX - 0.03, (sh / shelfCount) * i + 0.05, offZ + 0.01);
      group.add(led);
    }

    return group;
  }

  _detailValve(sw, sh, sd, material) {
    const group = new THREE.Group();
    const darkMetal = this._getOrCreateMaterial(0x2a2a30, { roughness: 0.5, metalness: 0.6 });
    const redMat = this._getOrCreateMaterial(0xaa3333, { roughness: 0.4, metalness: 0.3 });
    const pipeMat = this._getOrCreateMaterial(0x556677, { roughness: 0.6, metalness: 0.5 });
    const gaugeMat = this._getOrCreateMaterial(0x222222, { roughness: 0.3, metalness: 0.2 });

    // 1. Back mounting panel
    const panel = new THREE.Mesh(new THREE.BoxGeometry(sw * 0.9, sh * 0.7, 0.04), darkMetal);
    panel.position.set(0, sh * 0.45, -sd / 2 + 0.02);
    group.add(panel);

    // 2. Vertical pipe
    const pipeGeo = new THREE.CylinderGeometry(0.06, 0.06, sh * 1.1, 8);
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(0, sh * 0.5, 0);
    group.add(pipe);

    // 3. Horizontal shaft
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8),
      darkMetal
    );
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(0, sh * 0.55, sd / 2 - 0.05);
    group.add(shaft);

    // 4. Valve wheel group (rotates on interaction)
    const wheelGroup = new THREE.Group();
    wheelGroup.name = 'valve_wheel';
    wheelGroup.position.set(0, sh * 0.55, sd / 2 + 0.06);

    // Torus ring
    const ringRadius = Math.min(sw, sh) * 0.32;
    const tubeRadius = 0.025;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(ringRadius, tubeRadius, 8, 24),
      redMat
    );
    wheelGroup.add(ring);

    // 5 spokes
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const spoke = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, ringRadius * 2, 6),
        redMat
      );
      spoke.rotation.z = angle;
      wheelGroup.add(spoke);
    }

    // Center hub
    const hub = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      darkMetal
    );
    wheelGroup.add(hub);

    group.add(wheelGroup);

    // 5. Pressure gauge (side)
    const gauge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16),
      gaugeMat
    );
    gauge.rotation.x = Math.PI / 2;
    gauge.position.set(sw * 0.35, sh * 0.7, 0.02);
    group.add(gauge);

    // Gauge face
    const gaugeFace = new THREE.Mesh(
      new THREE.CircleGeometry(0.055, 16),
      this._getOrCreateMaterial(0xccccbb, { roughness: 0.2, metalness: 0.1 })
    );
    gaugeFace.position.set(sw * 0.35, sh * 0.7, 0.035);
    group.add(gaugeFace);

    return group;
  }

  _detailCrate(sw, sh, sd, material) {
    const group = new THREE.Group();
    const stripMat = this._getOrCreateMaterial(0x555555, { roughness: 0.5, metalness: 0.5 });
    const stripW = 0.02;

    // Main body — slightly inset from full size
    const body = new THREE.Mesh(new THREE.BoxGeometry(sw - 0.01, sh - 0.01, sd - 0.01), material);
    body.position.set(0, sh / 2, 0);
    group.add(body);

    // 4 vertical corner strips
    const stripGeo = new THREE.BoxGeometry(stripW, sh, stripW);
    const hx = sw / 2, hz = sd / 2;
    for (const [cx, cz] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]]) {
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(cx, sh / 2, cz);
      group.add(strip);
    }

    // 2 horizontal bands (front + back)
    const bandH = stripW;
    const bandY = sh * 0.35;
    const bandGeo = new THREE.BoxGeometry(sw + 0.005, bandH, stripW);
    for (const bz of [-hz, hz]) {
      const band = new THREE.Mesh(bandGeo, stripMat);
      band.position.set(0, bandY, bz);
      group.add(band);
    }
    // 2 horizontal bands (left + right sides)
    const sideBandGeo = new THREE.BoxGeometry(stripW, bandH, sd + 0.005);
    for (const bx of [-hx, hx]) {
      const band = new THREE.Mesh(sideBandGeo, stripMat);
      band.position.set(bx, bandY, 0);
      group.add(band);
    }

    return group;
  }

  _detailConsole(sw, sh, sd, material, roomId) {
    const group = new THREE.Group();
    const caseMat = this._getOrCreateMaterial(0x2a2822, { roughness: 0.6, metalness: 0.1 });
    const darkMat = this._getOrCreateMaterial(0x111111, { roughness: 0.8, metalness: 0.0 });

    // ── Main case body ──
    const body = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), caseMat);
    body.position.set(0, sh / 2, 0);
    group.add(body);

    // ── Recessed screen area (dark inset) ──
    const recessW = sw * 0.72;
    const recessH = sh * 0.47;
    const screenY = sh * 0.62;
    const recess = new THREE.Mesh(
      new THREE.BoxGeometry(recessW, recessH, 0.03),
      darkMat
    );
    recess.position.set(0, screenY, sd / 2 - 0.01);
    group.add(recess);

    // ── Screen with terminal text ──
    const screenW = recessW - 0.04;
    const screenH = recessH - 0.04;
    const conScreenMat = this._generateScreenMaterial(roomId);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(screenW, screenH),
      conScreenMat
    );
    screen.position.set(0, screenY, sd / 2 + 0.015);
    group.add(screen);

    // ── Ventilation slots (top front, 5 lines) ──
    const ventY = sh - 0.06;
    for (let i = 0; i < 5; i++) {
      const vent = new THREE.Mesh(
        new THREE.BoxGeometry(sw * 0.5, 0.004, 0.005),
        darkMat
      );
      vent.position.set(0, ventY - i * 0.015, sd / 2 + 0.003);
      group.add(vent);
    }

    // ── Floppy disk slot (below screen) ──
    const floppyY = screenY - recessH / 2 - 0.06;
    const floppy = new THREE.Mesh(
      new THREE.BoxGeometry(sw * 0.2, 0.006, 0.005),
      darkMat
    );
    floppy.position.set(sw * 0.15, floppyY, sd / 2 + 0.003);
    group.add(floppy);

    // ── Base/foot (slightly wider) ──
    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(sw + 0.04, 0.025, sd + 0.04),
      caseMat
    );
    foot.position.set(0, 0.0125, 0);
    group.add(foot);

    return group;
  }

  // ── Era-based Decorations ─────────────────────────────

  /**
   * Add wall graffiti/writings for a room based on era.
   */
  _addWallWritings(room, era) {
    const writings = WALL_WRITINGS[era];
    if (!writings || writings.length === 0) return;
    // Also include writings from lower eras (cumulative)
    const allWritings = [];
    for (let e = 2; e <= era; e++) {
      if (WALL_WRITINGS[e]) allWritings.push(...WALL_WRITINGS[e]);
    }

    const [ox, oy, oz] = room.origin;
    const [w, h, d] = room.size;
    const seed = hashString(room.id + era);
    const rng = seededRandom(seed);

    // Determine writing count based on era
    const countRange = { 2: [0, 2], 3: [1, 3], 4: [2, 4], 5: [3, 6] };
    const [minC, maxC] = countRange[era] || [0, 0];
    const count = minC + Math.floor(rng() * (maxC - minC + 1));
    if (count === 0) return;

    // Determine which walls are available (no door = full wall)
    const doorWalls = new Set(room.doors.map(d => d.wall));
    const wallDefs = [
      { name: 'north', cx: ox, cz: oz - d / 2, len: w, normalX: 0, normalZ: 1, rotY: 0 },
      { name: 'south', cx: ox, cz: oz + d / 2, len: w, normalX: 0, normalZ: -1, rotY: Math.PI },
      { name: 'east',  cx: ox + w / 2, cz: oz, len: d, normalX: -1, normalZ: 0, rotY: -Math.PI / 2 },
      { name: 'west',  cx: ox - w / 2, cz: oz, len: d, normalX: 1, normalZ: 0, rotY: Math.PI / 2 },
    ];
    // Prefer walls without doors but allow doored walls with less probability
    const walls = wallDefs.filter(wd => !doorWalls.has(wd.name));
    if (walls.length === 0) return;

    const lang = this._lang || 'ko';

    for (let i = 0; i < count; i++) {
      const wall = walls[Math.floor(rng() * walls.length)];
      const writing = allWritings[Math.floor(rng() * allWritings.length)];
      const text = writing[lang] || writing.ko;
      const isLarge = writing.large || false;

      const fontSize = isLarge ? 48 : 22 + Math.floor(rng() * 12);
      const texW = isLarge ? 512 : 256;
      const texH = isLarge ? 256 : 128;

      const tex = this._textures.generateWallText(text, writing.style, {
        fontSize, width: texW, height: texH,
      });

      // Physical size of the decal in world units
      const planeW = isLarge ? 3.0 : 1.2 + rng() * 0.8;
      const planeH = planeW * (texH / texW);

      const geo = new THREE.PlaneGeometry(planeW, planeH);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.05,
        depthWrite: false,
        side: THREE.FrontSide,
      });

      const mesh = new THREE.Mesh(geo, mat);

      // Position on wall surface
      const offsetAlongWall = (rng() - 0.5) * wall.len * 0.7;
      const heightPos = oy + 0.5 + rng() * (h - 1.5);

      if (wall.name === 'north' || wall.name === 'south') {
        mesh.position.set(
          wall.cx + offsetAlongWall,
          heightPos,
          wall.cz + wall.normalZ * 0.12
        );
      } else {
        mesh.position.set(
          wall.cx + wall.normalX * 0.12,
          heightPos,
          wall.cz + offsetAlongWall
        );
      }

      mesh.rotation.y = wall.rotY;
      // Slight random tilt for organic feel
      mesh.rotation.z = (rng() - 0.5) * 0.12;

      this.group.add(mesh);
    }
  }

  /**
   * Add floor stains/decals for a room based on era.
   */
  _addFloorStains(room, era) {
    const [ox, oy, oz] = room.origin;
    const [w, , d] = room.size;
    const seed = hashString(room.id + 'floor' + era);
    const rng = seededRandom(seed);

    const stainCount = era >= 5 ? 2 + Math.floor(rng() * 3) :
                       era >= 4 ? 1 + Math.floor(rng() * 2) :
                       Math.floor(rng() * 2);
    if (stainCount === 0) return;

    for (let i = 0; i < stainCount; i++) {
      const size = 0.5 + rng() * 1.5;
      const posX = ox + (rng() - 0.5) * (w - 1);
      const posZ = oz + (rng() - 0.5) * (d - 1);

      // Create stain canvas
      const canvasSize = 64;
      const canvas = document.createElement('canvas');
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      const isBlood = era >= 4 && rng() > 0.4;
      const r = isBlood ? 80 + Math.floor(rng() * 60) : 30 + Math.floor(rng() * 20);
      const g = isBlood ? 5 + Math.floor(rng() * 10) : 25 + Math.floor(rng() * 15);
      const b = isBlood ? 5 + Math.floor(rng() * 10) : 25 + Math.floor(rng() * 15);
      const alpha = 0.3 + rng() * 0.3;

      // Irregular blob shape
      const cx = canvasSize / 2;
      const cy = canvasSize / 2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvasSize / 2);
      grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
      grad.addColorStop(0.6, `rgba(${r},${g},${b},${alpha * 0.5})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      // Irregular circle
      for (let a = 0; a < Math.PI * 2; a += 0.3) {
        const rad = (canvasSize / 2) * (0.6 + rng() * 0.4);
        const px = cx + Math.cos(a) * rad;
        const py = cy + Math.sin(a) * rad;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const geo = new THREE.PlaneGeometry(size, size);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.02,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2; // face up
      mesh.position.set(posX, oy + 0.01, posZ);
      mesh.rotation.z = rng() * Math.PI * 2;
      this.group.add(mesh);
    }
  }

  /**
   * Set language for wall writings.
   */
  setLang(lang) {
    this._lang = lang;
  }

  /**
   * No-op — kept for API compatibility with main.js.
   * Lighting is now handled globally via ambient/hemisphere lights.
   */
  updateShadowsForRoom(roomId) {
    // No per-room lights to manage
  }

  /**
   * Get the room the player is currently in based on position.
   */
  getRoomAtPosition(pos) {
    const rooms = this._activeRooms || ROOMS;
    for (const room of rooms) {
      // Skip rooms not built for current era
      if (!this._activeRooms && room.eraMin && (this.era || 1) < room.eraMin) continue;
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

  // ── Era-specific Props ─────────────────────────────────

  _buildEraProps(era) {
    if (era >= 5) {
      // Overwrite terminal in SERVER_ROOM
      const serverRoom = ROOMS.find(r => r.id === 'SERVER_ROOM');
      if (serverRoom) {
        const [ox, oy, oz] = serverRoom.origin;
        const prop = {
          type: 'console', position: [2, 0.4, -3], size: [0.6, 0.8, 0.5],
          color: 0xaa2222, id: 'overwrite_terminal'
        };
        this._buildProp(prop, ox, oy, oz, 'SERVER_ROOM');
      }
    }
  }

  // ── Ghost Figure System ────────────────────────────────

  _createGhostMesh(config) {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({
      color: 0x444466, transparent: true, opacity: 0.35, depthWrite: false,
    });

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), mat);
    head.position.y = 1.65;
    group.add(head);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.25), mat);
    torso.position.y = 1.2;
    group.add(torso);

    // Left leg
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.2), mat);
    legL.position.set(-0.1, 0.6, 0);
    group.add(legL);

    // Right leg
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.2), mat);
    legR.position.set(0.1, 0.6, 0);
    group.add(legR);

    group.position.set(config.x, config.y, config.z);
    if (config.rotY) group.rotation.y = config.rotY;

    group.userData = {
      ghostId: config.id,
      persistent: config.persistent || false,
      faded: false,
      triggered: false,
    };

    return group;
  }

  _buildGhostFigures(era) {
    const GHOST_CONFIGS = [
      // Era 4: FORGOTTEN_WING — corner facing wall
      { id: 'forgotten', era: 4, room: 'FORGOTTEN_WING', x: -68 - 3, y: 0, z: -21 - 2.5, rotY: Math.PI },
      // Era 4: HOLDING_CELLS — sitting in cell
      { id: 'holding', era: 4, room: 'HOLDING_CELLS', x: 22 - 3, y: 0, z: -34 - 1, rotY: 0 },
      // Era 5: VENTILATION_SHAFT — standing at end of duct
      { id: 'vent', era: 5, room: 'VENTILATION_SHAFT', x: 22, y: 0, z: -11 + 4, rotY: Math.PI },
      // Era 5: DEEP_STORAGE — between containers
      { id: 'deep_storage', era: 5, room: 'DEEP_STORAGE', x: 58, y: 0, z: -45, rotY: -Math.PI / 4 },
      // Era 5: SUBJECT_CHAMBER — persistent, faces player
      { id: 'subject_chamber', era: 5, room: 'SUBJECT_CHAMBER', x: 65, y: 0, z: -45, rotY: 0, persistent: true },
    ];

    // Check which rooms are active
    const activeRoomIds = new Set((this._activeRooms || []).map(r => r.id));

    const ghosts = [];
    for (const config of GHOST_CONFIGS) {
      if (era < config.era) continue;
      // Don't spawn ghosts in rooms that don't exist in this variant
      if (config.room && !activeRoomIds.has(config.room)) continue;
      const ghost = this._createGhostMesh(config);
      this.group.add(ghost);
      ghosts.push(ghost);
    }

    // SHOOTER_PARODY: extra ghost enemies in hallway
    if (this._variant && this._variant.id === 'SHOOTER_PARODY') {
      const shooterGhosts = [
        { id: 'enemy_1', era: 5, x: 0, y: 0, z: -8, rotY: Math.PI },
        { id: 'enemy_2', era: 5, x: -1, y: 0, z: -15, rotY: Math.PI * 0.8 },
        { id: 'enemy_3', era: 5, x: 1, y: 0, z: -20, rotY: -Math.PI * 0.5 },
        { id: 'enemy_4', era: 5, x: 0, y: 0, z: -23, rotY: 0 },
      ];
      for (const config of shooterGhosts) {
        const ghost = this._createGhostMesh(config);
        this.group.add(ghost);
        ghosts.push(ghost);
      }
    }

    return ghosts;
  }
}
