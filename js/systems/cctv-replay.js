/**
 * CCTV Replay System — Era 6-7.
 *
 * Replays player's compliance or defiance path from a fixed ceiling camera perspective.
 * A silhouette character walks predefined waypoints while narrator comments.
 */
import * as THREE from 'three';

// ── Waypoint Paths ──────────────────────────────────────
// Each waypoint: { pos: [x,y,z], room: 'ROOM_ID', pause?: ms }
// Derived from map-data room origins

const COMPLIANCE_PATH = [
  { pos: [0, 0, 0], room: 'START_ROOM', pause: 2000 },
  { pos: [0, 0, -4], room: 'HALLWAY_1' },
  { pos: [0, 0, -14], room: 'HALLWAY_1' },
  { pos: [0, 0, -21], room: 'HALLWAY_1', pause: 1500 },
  { pos: [-4, 0, -21], room: 'CORRIDOR_COMP_1' },
  { pos: [-9, 0, -21], room: 'CORRIDOR_COMP_1' },
  { pos: [-16, 0, -21], room: 'OFFICE_WING' },
  { pos: [-23, 0, -21], room: 'OFFICE_WING', pause: 2000 },
  { pos: [-30, 0, -21], room: 'CORRIDOR_COMP_2' },
  { pos: [-37, 0, -21], room: 'CORRIDOR_COMP_2' },
  { pos: [-43, 0, -21], room: 'CONFERENCE' },
  { pos: [-49, 0, -21], room: 'CONFERENCE', pause: 1000 },
  { pos: [-49, 0, -27], room: 'CORRIDOR_COMP_3' },
  { pos: [-49, 0, -33], room: 'CORRIDOR_COMP_3' },
  { pos: [-49, 0, -38], room: 'UPPER_OFFICE' },
  { pos: [-49, 0, -43], room: 'UPPER_OFFICE', pause: 1500 },
  { pos: [-49, 0, -48], room: 'CORRIDOR_COMP_4' },
  { pos: [-49, 0, -53], room: 'CORRIDOR_COMP_4' },
  { pos: [-49, 0, -60], room: 'GARDEN_ANTECHAMBER' },
  { pos: [-49, 0, -63], room: 'GARDEN_ANTECHAMBER', pause: 2000 },
  { pos: [-49, 0, -68], room: 'FALSE_ENDING_ROOM' },
  { pos: [-49, 0, -72], room: 'FALSE_ENDING_ROOM', pause: 3000 },
];

const DEFIANCE_PATH = [
  { pos: [0, 0, 0], room: 'START_ROOM', pause: 2000 },
  { pos: [0, 0, -4], room: 'HALLWAY_1' },
  { pos: [0, 0, -14], room: 'HALLWAY_1' },
  { pos: [0, 0, -21], room: 'HALLWAY_1', pause: 1500 },
  { pos: [4, 0, -21], room: 'CORRIDOR_DEF_1' },
  { pos: [9, 0, -21], room: 'CORRIDOR_DEF_1' },
  { pos: [16, 0, -21], room: 'MAINTENANCE' },
  { pos: [22, 0, -21], room: 'MAINTENANCE', pause: 2000 },
  { pos: [28, 0, -21], room: 'CORRIDOR_DEF_2' },
  { pos: [35, 0, -21], room: 'CORRIDOR_DEF_2' },
  { pos: [42, 0, -21], room: 'SERVER_ROOM' },
  { pos: [48, 0, -21], room: 'SERVER_ROOM', pause: 1000 },
  { pos: [52, 0, -21], room: 'GENERATOR' },
  { pos: [58, 0, -21], room: 'GENERATOR', pause: 1000 },
  { pos: [48, 0, -27], room: 'CORRIDOR_DEF_3' },
  { pos: [48, 0, -33], room: 'CORRIDOR_DEF_3' },
  { pos: [48, 0, -39], room: 'DATA_CENTER' },
  { pos: [48, 0, -45], room: 'DATA_CENTER', pause: 1500 },
  { pos: [48, 0, -51], room: 'CORRIDOR_DEF_4' },
  { pos: [48, 0, -57], room: 'CORRIDOR_DEF_4' },
  { pos: [48, 0, -63], room: 'CONTROL_ROOM' },
  { pos: [48, 0, -70], room: 'CONTROL_ROOM', pause: 3000 },
];

// Narrator script keys at specific waypoint indices
const CCTV_NARRATOR_EVENTS = {
  compliance: {
    0: 'cctv_start',
    3: 'cctv_decision_compliance',
    7: 'cctv_office_enter',
    13: 'cctv_midpoint',
    19: 'cctv_garden',
    21: 'cctv_ending_room_compliance',
  },
  defiance: {
    0: 'cctv_start',
    3: 'cctv_decision_defiance',
    7: 'cctv_maintenance_enter',
    11: 'cctv_midpoint',
    17: 'cctv_data_center',
    21: 'cctv_ending_room_defiance',
  },
};

// ── Room-based Camera Positions ──────────────────────────
// Auto-computed: ceiling corner, looking down toward room center

function getCameraForRoom(roomId, roomOrigin, roomSize) {
  if (!roomOrigin || !roomSize) return null;
  const [ox, oy, oz] = roomOrigin;
  const [w, h, d] = roomSize;
  return {
    position: new THREE.Vector3(ox + w * 0.4, oy + h - 0.3, oz + d * 0.4),
    lookAt: new THREE.Vector3(ox, oy + 0.8, oz),
  };
}

// Room dimension lookup (subset used by paths)
const ROOM_DATA = {
  START_ROOM: { origin: [0, 0, 0], size: [6, 3, 6] },
  HALLWAY_1: { origin: [0, 0, -14], size: [4, 3, 22] },
  CORRIDOR_COMP_1: { origin: [-9, 0, -21], size: [14, 3, 4] },
  OFFICE_WING: { origin: [-23, 0, -21], size: [14, 3, 10] },
  CORRIDOR_COMP_2: { origin: [-37, 0, -21], size: [14, 3, 4] },
  CONFERENCE: { origin: [-49, 0, -21], size: [10, 3, 8] },
  CORRIDOR_COMP_3: { origin: [-49, 0, -33], size: [4, 3, 14] },
  UPPER_OFFICE: { origin: [-49, 0, -43], size: [8, 3, 6] },
  CORRIDOR_COMP_4: { origin: [-49, 0, -53], size: [4, 3, 10] },
  GARDEN_ANTECHAMBER: { origin: [-49, 0, -63], size: [8, 3, 6] },
  FALSE_ENDING_ROOM: { origin: [-49, 0, -72], size: [12, 4, 12] },
  CORRIDOR_DEF_1: { origin: [9, 0, -21], size: [14, 3, 4] },
  MAINTENANCE: { origin: [22, 0, -21], size: [12, 3, 8] },
  CORRIDOR_DEF_2: { origin: [35, 0, -21], size: [14, 3, 4] },
  SERVER_ROOM: { origin: [48, 0, -21], size: [10, 3, 8] },
  GENERATOR: { origin: [58, 0, -21], size: [8, 3, 6] },
  CORRIDOR_DEF_3: { origin: [48, 0, -33], size: [4, 3, 14] },
  DATA_CENTER: { origin: [48, 0, -45], size: [10, 3, 10] },
  CORRIDOR_DEF_4: { origin: [48, 0, -57], size: [4, 3, 14] },
  CONTROL_ROOM: { origin: [48, 0, -70], size: [14, 4, 12] },
};

export class CCTVReplay {
  constructor(renderer, narrator, memory, getLang) {
    this.renderer = renderer;
    this.narrator = narrator;
    this.memory = memory;
    this.getLang = getLang;

    this._active = false;
    this._pathType = null;
    this._waypoints = [];
    this._waypointIndex = 0;
    this._character = null;
    this._scene = null;
    this._camera = null;
    this._currentRoom = null;
    this._moveSpeed = 2.5; // units/sec
    this._pauseTimer = 0;
    this._targetPos = new THREE.Vector3();
    this._charPos = new THREE.Vector3();
    this._cameraPos = new THREE.Vector3();
    this._cameraTarget = new THREE.Vector3();
    this._cameraLerp = 0;
    this._cameraFrom = new THREE.Vector3();
    this._cameraLookFrom = new THREE.Vector3();
    this._narratorEvents = {};
    this._triggeredEvents = new Set();
    this._doorSystem = null;
    this._openedDoors = new Set();

    this.onComplete = null;

    // Overlay
    this._overlay = document.getElementById('cctv-overlay');
    this._camLabel = null;
    this._timestamp = null;
    this._recDot = null;
  }

  start(pathType, scene, camera, buildResult) {
    this._active = true;
    this._pathType = pathType;
    this._scene = scene;
    this._camera = camera;
    this._waypoints = pathType === 'compliance' ? COMPLIANCE_PATH : DEFIANCE_PATH;
    this._waypointIndex = 0;
    this._pauseTimer = this._waypoints[0].pause || 0;
    this._triggeredEvents.clear();
    this._openedDoors.clear();
    this._narratorEvents = CCTV_NARRATOR_EVENTS[pathType] || {};
    this._doorSystem = buildResult.doorSystem || null;

    // Create character silhouette
    this._createCharacter();

    // Set initial position
    const start = this._waypoints[0];
    this._charPos.set(start.pos[0], start.pos[1] + 0.9, start.pos[2]);
    this._character.position.copy(this._charPos);

    // Set initial camera
    this._currentRoom = start.room;
    this._setupCameraForRoom(start.room, true);

    // Show overlay
    this._showOverlay();

    // Trigger initial narrator event
    this._checkNarratorEvent(0);

    // Pre-open door to first room transition
    this._preOpenDoorsToNextRoom();
  }

  update(delta) {
    if (!this._active || !this._character) return;

    // Handle pause
    if (this._pauseTimer > 0) {
      this._pauseTimer -= delta * 1000;
      this._updateOverlayTime();
      this._updateCameraLerp(delta);
      return;
    }

    // Move toward next waypoint
    if (this._waypointIndex >= this._waypoints.length - 1) {
      // Reached end
      this._complete();
      return;
    }

    const nextWP = this._waypoints[this._waypointIndex + 1];
    this._targetPos.set(nextWP.pos[0], nextWP.pos[1] + 0.9, nextWP.pos[2]);

    const dir = this._targetPos.clone().sub(this._charPos);
    const dist = dir.length();

    if (dist < 0.1) {
      // Arrived at waypoint
      this._waypointIndex++;
      this._charPos.copy(this._targetPos);
      this._character.position.copy(this._charPos);

      // Check for room change
      if (nextWP.room !== this._currentRoom) {
        this._currentRoom = nextWP.room;
        this._setupCameraForRoom(nextWP.room, false);
      }

      // Check narrator event
      this._checkNarratorEvent(this._waypointIndex);

      // Pre-open doors to next room before character starts moving
      this._preOpenDoorsToNextRoom();

      // Set pause
      this._pauseTimer = nextWP.pause || 0;
    } else {
      // Move
      dir.normalize();
      const step = Math.min(this._moveSpeed * delta, dist);
      this._charPos.addScaledVector(dir, step);
      this._character.position.copy(this._charPos);

      // Character faces movement direction
      this._character.lookAt(this._targetPos.x, this._charPos.y, this._targetPos.z);
    }

    this._updateOverlayTime();
    this._updateCameraLerp(delta);
  }

  stop() {
    this._active = false;
    if (this._character && this._scene) {
      this._scene.remove(this._character);
      this._character.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
      this._character = null;
    }
    this._hideOverlay();
  }

  _createCharacter() {
    const group = new THREE.Group();

    // Body — dark cylinder
    const bodyGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.2, 8);
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x1a1a2a, transparent: true, opacity: 0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    group.add(body);

    // Head — dark sphere
    const headGeo = new THREE.SphereGeometry(0.18, 8, 6);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x1a1a2a, transparent: true, opacity: 0.8 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.35;
    group.add(head);

    this._character = group;
    this._scene.add(group);
  }

  _setupCameraForRoom(roomId, instant) {
    const data = ROOM_DATA[roomId];
    if (!data) return;

    const cam = getCameraForRoom(roomId, data.origin, data.size);
    if (!cam) return;

    if (instant) {
      this._camera.position.copy(cam.position);
      this._camera.lookAt(cam.lookAt);
      this._cameraPos.copy(cam.position);
      this._cameraTarget.copy(cam.lookAt);
      this._cameraLerp = 1;
    } else {
      this._cameraFrom.copy(this._camera.position);
      this._cameraLookFrom.copy(this._cameraTarget);
      this._cameraPos.copy(cam.position);
      this._cameraTarget.copy(cam.lookAt);
      this._cameraLerp = 0;
    }

    // Update overlay camera label
    if (this._camLabel) {
      this._camLabel.textContent = `CAM-${roomId.replace(/_/g, '').slice(0, 8).toUpperCase()}`;
    }
  }

  _updateCameraLerp(delta) {
    if (this._cameraLerp < 1) {
      this._cameraLerp = Math.min(this._cameraLerp + delta * 3.3, 1); // ~0.3s
      const t = this._cameraLerp;
      this._camera.position.lerpVectors(this._cameraFrom, this._cameraPos, t);
      const lookTarget = new THREE.Vector3().lerpVectors(this._cameraLookFrom, this._cameraTarget, t);
      this._camera.lookAt(lookTarget);
    } else {
      this._camera.position.copy(this._cameraPos);
      this._camera.lookAt(this._cameraTarget);
    }
  }

  _checkNarratorEvent(index) {
    const scriptId = this._narratorEvents[index];
    if (scriptId && !this._triggeredEvents.has(index)) {
      this._triggeredEvents.add(index);
      // Use narrator with a CCTV-specific line
      const lang = this.getLang();
      const line = CCTV_SCRIPTS[scriptId];
      if (line) {
        const text = lang === 'ko' ? line.ko : line.en;
        this.narrator.say(text, { mood: line.mood || 'calm', id: scriptId });
      }
    }
  }

  _preOpenDoorsToNextRoom() {
    if (!this._doorSystem) return;
    const idx = this._waypointIndex;
    if (idx >= this._waypoints.length - 1) return;
    const next = this._waypoints[idx + 1];
    if (next.room === this._currentRoom) return;

    // Determine movement direction → exit/entry walls
    const cur = this._waypoints[idx];
    const dx = next.pos[0] - cur.pos[0];
    const dz = next.pos[2] - cur.pos[2];
    let exitWall, entryWall;
    if (Math.abs(dz) >= Math.abs(dx)) {
      exitWall = dz < 0 ? 'north' : 'south';
      entryWall = dz < 0 ? 'south' : 'north';
    } else {
      exitWall = dx < 0 ? 'west' : 'east';
      entryWall = dx < 0 ? 'east' : 'west';
    }

    const exitId = `${this._currentRoom}_${exitWall}`;
    const entryId = `${next.room}_${entryWall}`;

    for (const door of this._doorSystem.doors) {
      if ((door.id === exitId || door.id === entryId) && !this._openedDoors.has(door.id)) {
        this._openedDoors.add(door.id);
        this._doorSystem.openDoor(door);
      }
    }
  }

  _showOverlay() {
    if (!this._overlay) return;
    this._overlay.style.display = 'block';
    this._camLabel = this._overlay.querySelector('.cctv-cam-id');
    this._timestamp = this._overlay.querySelector('.cctv-timestamp');
    this._recDot = this._overlay.querySelector('.cctv-rec');
  }

  _hideOverlay() {
    if (this._overlay) this._overlay.style.display = 'none';
  }

  _updateOverlayTime() {
    if (this._timestamp) {
      const now = new Date();
      this._timestamp.textContent = now.toTimeString().slice(0, 8);
    }
  }

  _complete() {
    this._active = false;

    // Fade out
    const fade = document.createElement('div');
    fade.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;opacity:0;transition:opacity 2s;z-index:9999;pointer-events:none';
    document.body.appendChild(fade);
    requestAnimationFrame(() => { fade.style.opacity = '1'; });

    // Show completion text
    setTimeout(() => {
      this._hideOverlay();
      const lang = this.getLang();
      const completeText = lang === 'ko' ? '관찰 기록 재생 완료' : 'Observation Log Replay Complete';
      const completeDiv = document.createElement('div');
      completeDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:rgba(255,255,255,0.7);font-size:1.5rem;letter-spacing:0.2em;z-index:10000;text-align:center';
      completeDiv.textContent = completeText;
      document.body.appendChild(completeDiv);

      setTimeout(() => {
        fade.remove();
        completeDiv.remove();
        this.stop();
        if (this.onComplete) this.onComplete();
      }, 3000);
    }, 2000);
  }
}

// ── CCTV Narrator Scripts (inline, no dependency on script-data) ─────

const CCTV_SCRIPTS = {
  cctv_start: {
    ko: '기록 재생 시작... 피험자 #7491, 시뮬레이션 시작 시점.',
    en: 'Record playback initiated... Subject #7491, simulation start point.',
    mood: 'calm',
  },
  cctv_decision_compliance: {
    ko: '결정 지점 도달. 피험자가 왼쪽을 선택합니다. 순응 경로.',
    en: 'Decision point reached. Subject chooses left. Compliance path.',
    mood: 'calm',
  },
  cctv_decision_defiance: {
    ko: '결정 지점 도달. 피험자가 오른쪽을 선택합니다. 반항 경로.',
    en: 'Decision point reached. Subject chooses right. Defiance path.',
    mood: 'calm',
  },
  cctv_office_enter: {
    ko: '사무실 구역 진입. 이게 내가 고른 길이었어?',
    en: 'Entering office wing. Was this the path I chose?',
    mood: 'curious',
  },
  cctv_maintenance_enter: {
    ko: '유지보수 구역 진입. 이 길은... 낯설지 않아.',
    en: 'Entering maintenance area. This path... feels familiar.',
    mood: 'curious',
  },
  cctv_midpoint: {
    ko: '경로 중간 지점. 피험자의 행동 패턴이 기록과 일치합니다.',
    en: 'Path midpoint. Subject behavior pattern matches records.',
    mood: 'calm',
  },
  cctv_garden: {
    ko: '정원 전실 도달. 곧 끝이야. 매번 이렇게 끝나.',
    en: 'Garden antechamber reached. It\'s almost over. It always ends like this.',
    mood: 'regretful',
  },
  cctv_data_center: {
    ko: '데이터 센터 통과 중. 이 기계들이 전부 날 위한 거였어?',
    en: 'Passing through data center. Were all these machines for me?',
    mood: 'curious',
  },
  cctv_ending_room_compliance: {
    ko: '정원 도착. 피험자가 끝에 도달했습니다. 기록 종료.',
    en: 'Garden reached. Subject has reached the end. Record terminated.',
    mood: 'calm',
  },
  cctv_ending_room_defiance: {
    ko: '제어실 도착. 피험자가 끝에 도달했습니다. 기록 종료.',
    en: 'Control room reached. Subject has reached the end. Record terminated.',
    mood: 'calm',
  },
};
