/**
 * Era 9 Ending — 3D zoom-out + dual classic Macintosh + ChatML sequence.
 *
 * Observer room at y=50. Camera starts zoomed into the left Mac screen
 * (filling viewport, no bezel visible), then pulls back to reveal both
 * Macs, then zooms into the right Mac for ChatML scrolling.
 *
 * The monitors are styled after the original Macintosh 128K (1984):
 * boxy all-in-one case with built-in CRT, ventilation slots, floppy drive.
 *
 * Phases:
 * 1. GLITCH (0-2s) — left Mac zoomed in (fills viewport), heavy postfx
 * 2. ZOOM_OUT (2-5s) — left Mac → center wide (both Macs visible)
 * 3. ZOOM_RIGHT (5-8s) — center → right Mac close-up
 * 4. CHATML (8s~) — right Mac ChatML lines scroll
 * 5. FADE (chatDone+1.5s) — CSS fade to black
 * 6. TITLE (chatDone+3.5s) — title screen
 * 7. RESTART — buttons + credits
 */
import * as THREE from 'three';

const ROOM_Y = 50;

// Classic Macintosh dimensions (stylized, scaled up for readability)
const MAC_W = 1.20;        // case width
const MAC_H = 1.52;        // case height
const MAC_D = 0.65;        // case depth
const SCREEN_W = 0.86;     // screen visible area width (~4:3)
const SCREEN_H = 0.66;     // screen visible area height
const MAC_GAP = 0.26;      // gap between two Macs

const DESK_TOP = 0.75;     // desk surface height
const SCREEN_Y = DESK_TOP + MAC_H * 0.62;  // screen center (62% up the case)
const MAC_Z = -1.15;       // depth position of Macs on desk

const LEFT_X = -(MAC_W / 2 + MAC_GAP / 2);
const RIGHT_X = (MAC_W / 2 + MAC_GAP / 2);

// ── 3×3 Grid for left Mac screen ──────────────────────────
const GRID_COLS = 3, GRID_ROWS = 3;
const CELL_W = 160, CELL_H = 120;             // 4:3 per cell (halved for perf)
const GRID_GAP = 0;                              // no pixel gaps; grid drawn in shader
const RT_W = CELL_W * GRID_COLS;                  // 480
const RT_H = CELL_H * GRID_ROWS;                  // 360

const GRID_ROOMS = {
  OFFICE_WING:  { origin: [-23, 0, -21], size: [14, 3, 10] },
  MAINTENANCE:  { origin: [22, 0, -21],  size: [12, 3, 8] },
  SERVER_ROOM:  { origin: [48, 0, -21],  size: [12, 3, 10] },
  DATA_CENTER:  { origin: [48, 0, -45],  size: [12, 4, 10] },
  CONTROL_ROOM: { origin: [48, 0, -70],  size: [14, 4, 12] },
};

// Layout:
//  [CCTV:OFFICE_WING]  [Actor:HALLWAY_END]   [CCTV:MAINTENANCE]
//  [Actor:CONFERENCE]   [Actor:START_ROOM]    [CCTV:SERVER_ROOM]
//  [CCTV:DATA_CENTER]   [Actor:FALSE_ENDING]  [CCTV:CONTROL_ROOM]
const GRID_CELLS = [
  { type: 'cctv',  room: 'OFFICE_WING' },
  { type: 'actor', pos: [0, 1.6, -20],      look: [0, 1.6, -10] },         // HALLWAY end (looking back)
  { type: 'cctv',  room: 'MAINTENANCE' },
  { type: 'actor', pos: [-49, 1.6, -18],    look: [-49, 1.6, -24] },       // CONFERENCE
  { type: 'actor', pos: [0, 1.6, 0],        look: [0, 1.6, -3] },          // START_ROOM (center)
  { type: 'cctv',  room: 'SERVER_ROOM' },
  { type: 'cctv',  room: 'DATA_CENTER' },
  { type: 'actor', pos: [-23, 1.6, -45],    look: [-23, 1.6, -50] },       // FALSE_ENDING area
  { type: 'cctv',  room: 'CONTROL_ROOM' },
];

const CHAR_PATHS = [
  { room: 'OFFICE_WING',  a: [-20, 0, -21], b: [-26, 0, -21], speed: 1.5 },
  { room: 'MAINTENANCE',  a: [19, 0, -21],  b: [25, 0, -21],  speed: 1.8 },
  { room: 'SERVER_ROOM',  a: [45, 0, -21],  b: [51, 0, -21],  speed: 1.5 },
  { room: 'DATA_CENTER',  a: [45, 0, -45],  b: [51, 0, -45],  speed: 1.2 },
  { room: 'CONTROL_ROOM', a: [44, 0, -70],  b: [52, 0, -70],  speed: 1.0 },
];

// Per-cell CCTV labels — [camId, location]
const CELL_LABELS = [
  { cam: 'CAM-01', loc: 'OFFICE WING' },
  { cam: 'CAM-02', loc: 'HALLWAY' },
  { cam: 'CAM-03', loc: 'MAINTENANCE' },
  { cam: 'CAM-04', loc: 'CONFERENCE' },
  { cam: 'CAM-05', loc: 'START ROOM' },
  { cam: 'CAM-06', loc: 'SERVER ROOM' },
  { cam: 'CAM-07', loc: 'DATA CENTER' },
  { cam: 'CAM-08', loc: 'FALSE ENDING' },
  { cam: 'CAM-09', loc: 'CONTROL ROOM' },
];

// Per-cell atmosphere — colored ambient + background for visual distinction
const CELL_ATMOSPHERES = [
  { bg: 0x061a06, light: 0x00cc44 }, // 0: CCTV OFFICE_WING (green)
  { bg: 0x1a1206, light: 0xddaa33 }, // 1: Actor HALLWAY (amber)
  { bg: 0x061616, light: 0x33ccbb }, // 2: CCTV MAINTENANCE (teal)
  { bg: 0x1a0806, light: 0xcc7733 }, // 3: Actor CONFERENCE (orange)
  { bg: 0x0c0c08, light: 0xbbbb77 }, // 4: Actor START_ROOM (warm white)
  { bg: 0x06061a, light: 0x3388cc }, // 5: CCTV SERVER_ROOM (blue)
  { bg: 0x060616, light: 0x3344cc }, // 6: CCTV DATA_CENTER (indigo)
  { bg: 0x1a0804, light: 0xcc5533 }, // 7: Actor FALSE_ENDING (warm red)
  { bg: 0x0e0418, light: 0x7733cc }, // 8: CCTV CONTROL_ROOM (purple)
];

// Pre-created Color objects to avoid GC in render loop
const CELL_BG_COLORS = CELL_ATMOSPHERES.map(a => new THREE.Color(a.bg));

export class Era10Ending {
  constructor(memory, postfx, getLang) {
    this.memory = memory;
    this.postfx = postfx;
    this.getLang = getLang;
    this._timers = [];
    this.active = false;
    this._onRestart = null;
    this._onReplay = null;

    this._roomGroup = null;
    this._gameRT = null;
    this._chatCanvas = null;
    this._chatTexture = null;
    this._chatLines = [];
    this._chatGroups = [];     // end indices per role block
    this._chatGroupIndex = 0;
    this._chatLineIndex = 0;
    this._chatTimer = 0;
    this._chatStarted = false;
    this._chatDone = false;

    this._bootLines = [];      // terminal boot sequence lines
    this._bootIndex = 0;       // how many boot lines are visible
    this._bootTimer = 0;
    this._bootStarted = false;

    this._gridCameras = null;     // 9 PerspectiveCameras for grid cells
    this._gridCharacters = null;  // walking characters for CCTV cells
    this._actorAnims = null;      // actor camera animation state
    this._gameCamera = null;
    this._scene = null;
    this._renderer = null;
    this._camPos = [];       // [leftCloseUp, centerWide, rightCloseUp]
    this._camLook = [];      // corresponding lookAt targets
    this._lerpProgress = 0;  // ZOOM_OUT lerp
    this._lerpProgress2 = 0; // ZOOM_RIGHT lerp
    this._fadeTriggered = false;
    this._phase = 'IDLE';
    this._elapsed = 0;

    this._leftScreenMesh = null;
    this._rightScreenMesh = null;
    this._era1Light = null;

    // ── Optimization: temporal staggering + throttling ──
    this._gridFrameCounter = 0;   // round-robin counter for cell rendering
    this._overlayTimer = 0;       // throttle CCTV overlay to ~4fps
    this._tempDir = new THREE.Vector3();  // reusable for char walk
  }

  start(rendererObj, canvas, onRestart, onReplay) {
    if (this.active) return;
    this.active = true;
    this._onRestart = onRestart;
    this._onReplay = onReplay;
    this._renderer = rendererObj.renderer;
    this._scene = rendererObj.scene;
    this._gameCamera = rendererObj.camera;
    this._elapsed = 0;

    // 9 grid cameras for left-Mac RT render
    this._gridCameras = this._createGridCameras();

    // Grid characters (CCTV cells) + actor camera animations
    this._gridCharacters = this._createGridCharacters();
    this._actorAnims = this._createActorAnims();

    // RT for left Mac screen (3×3 grid)
    // Standard 8-bit RT. Rendered with ACES tone mapping.
    // Displayed via custom ShaderMaterial with brightness boost (bypasses lighting).
    this._gameRT = new THREE.WebGLRenderTarget(RT_W, RT_H, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    this._gameRT.texture.colorSpace = THREE.LinearSRGBColorSpace;

    // CCTV overlay canvas — per-cell labels (CAM ID, REC, timestamp)
    this._cctvOverlay = this._buildCCTVOverlay();
    this._cctvTexture = new THREE.CanvasTexture(this._cctvOverlay);
    this._cctvTexture.colorSpace = THREE.SRGBColorSpace;

    // Boot lines (terminal startup sequence) — shown before ChatML
    this._bootLines = this._buildBootLines();
    this._bootIndex = 0;
    this._bootTimer = 0;
    this._bootStarted = false;

    // ChatML data + group boundaries (by role block)
    this._chatLines = this._buildChatML();
    this._chatGroups = [];
    for (let i = 0; i < this._chatLines.length; i++) {
      if (this._chatLines[i].text === '<|im_end|>') this._chatGroups.push(i + 1);
    }
    if (!this._chatGroups.length || this._chatGroups[this._chatGroups.length - 1] < this._chatLines.length) {
      this._chatGroups.push(this._chatLines.length);
    }
    this._chatGroupIndex = 0;
    this._chatLineIndex = 0;
    this._chatTimer = 0;
    this._chatStarted = false;
    this._chatDone = false;
    this._buildChatMLTexture();

    // Build observer room
    this._buildRoom();

    // Extra ambient for grid RT render — base white illumination
    this._era1Light = new THREE.AmbientLight(0xffeedd, 15.0);
    this._era1Light.visible = false;
    this._scene.add(this._era1Light);

    // Per-cell colored ambient for visual distinction between grid cells
    this._cellLight = new THREE.AmbientLight(0xffffff, 12.0);
    this._cellLight.visible = false;
    this._scene.add(this._cellLight);

    // Compute camera distances from aspect ratio so monitors always fit
    const aspect = this._gameCamera.aspect || (window.innerWidth / window.innerHeight);
    const vfov = (this._gameCamera.fov || 70) * Math.PI / 180;
    const htan = Math.tan(vfov / 2) * aspect;  // half-width per unit depth
    const vtan = Math.tan(vfov / 2);            // half-height per unit depth

    const screenFace = MAC_Z + MAC_D / 2 + 0.015;  // Z of screen surface

    // cellCloseUp: center cell (1/3 of screen) fills viewport
    const cellNeedW = SCREEN_W / 3;
    const cellNeedH = SCREEN_H / 3;
    const cellDist = Math.max(cellNeedW / (2 * htan), cellNeedH / (2 * vtan));

    // centerWide: both Macs fully visible with generous margin
    const totalW = (RIGHT_X + MAC_W / 2) - (LEFT_X - MAC_W / 2) + 1.4;
    const totalH = MAC_H + 1.4;
    const centerDist = Math.max(totalW / (2 * htan), totalH / (2 * vtan));

    // rightCloseUp: screen area fills viewport (zoomed in, bezel barely visible)
    const rightNeedW = SCREEN_W + 0.12;
    const rightNeedH = SCREEN_H + 0.12;
    const rightDist = Math.max(rightNeedW / (2 * htan), rightNeedH / (2 * vtan));

    // 3 camera positions (world coords, room group at y=ROOM_Y)
    this._camPos = [
      // cellCloseUp: center cell of left Mac screen fills viewport
      new THREE.Vector3(LEFT_X, ROOM_Y + SCREEN_Y, screenFace + cellDist),
      // centerWide: both Macs visible, centered on screen height
      new THREE.Vector3(0, ROOM_Y + SCREEN_Y, screenFace + centerDist),
      // rightCloseUp: full right Mac case visible
      new THREE.Vector3(RIGHT_X, ROOM_Y + SCREEN_Y, screenFace + rightDist),
    ];
    this._camLook = [
      new THREE.Vector3(LEFT_X, ROOM_Y + SCREEN_Y, MAC_Z),
      new THREE.Vector3(0, ROOM_Y + SCREEN_Y, MAC_Z),
      new THREE.Vector3(RIGHT_X, ROOM_Y + SCREEN_Y, MAC_Z),
    ];
    this._lerpProgress = 0;
    this._lerpProgress2 = 0;
    this._fadeTriggered = false;

    // Phase 1: GLITCH — camera starts zoomed into left Mac screen
    this._phase = 'GLITCH';
    this._gameCamera.position.copy(this._camPos[0]);
    this._gameCamera.lookAt(this._camLook[0]);
    // Push fog out immediately so observer room is visible
    if (this._scene.fog) {
      this._scene.fog.near = 80;
      this._scene.fog.far = 200;
    }

    this.postfx.setGlitch(0);
    this.postfx.setNoise(0.08);
    this.postfx.setScanlines(0);
    this.postfx.setColorShift(0);
    this.postfx.setBrightness(1.0);
    this.postfx.setBloom(false);
    this.postfx.setPixelSize(0);
    this.postfx.enabled = true;

    // Start boot sequence on right Mac early (1s in, during GLITCH)
    this._timers.push(setTimeout(() => {
      this._bootStarted = true;
      this._updateChatMLTexture();
    }, 1000));

    // Phase 2: ZOOM_OUT — lerp from left close-up to center wide
    this._timers.push(setTimeout(() => {
      this._phase = 'ZOOM_OUT';
      this._lerpProgress = 0;
      // Disable postfx — no longer needed after glitch phase (saves full-screen pass)
      this.postfx.setNoise(0);
      this.postfx.enabled = false;
    }, 3000));

    // Phase 3: ZOOM_RIGHT — lerp from center to right close-up
    this._timers.push(setTimeout(() => {
      this._phase = 'ZOOM_RIGHT';
      this._lerpProgress2 = 0;
    }, 9000));

    // Phase 4: CHATML
    this._timers.push(setTimeout(() => {
      this._phase = 'CHATML';
      this._chatStarted = true;
    }, 14000));

    // FADE, TITLE, etc. triggered dynamically from _triggerEndSequence() when chatDone
  }

  update(delta) {
    if (!this.active) return;
    this._elapsed += delta;

    // Update CCTV overlay — throttled to ~4fps (REC blinks at 2Hz, timestamp at 1Hz)
    this._overlayTimer += delta;
    if (this._overlayTimer >= 0.25) {
      this._overlayTimer = 0;
      this._updateCCTVOverlay();
    }

    // Animate grid characters (CCTV cells)
    if (this._gridCharacters) {
      for (const char of this._gridCharacters) {
        this._updateCharWalk(char, delta);
      }
    }

    // Animate actor cameras (subtle head-bob + slow yaw)
    if (this._actorAnims) {
      for (const anim of this._actorAnims) {
        anim.cam.position.y = anim.baseY + Math.sin(this._elapsed * 3) * 0.02;
        const yaw = Math.sin(this._elapsed * 0.5 + anim.phaseOffset) * 0.05;
        const look = anim.baseLook.clone();
        look.x += Math.sin(yaw) * 2;
        anim.cam.lookAt(look);
      }
    }

    // Boot sequence: type out lines one by one on right Mac
    if (this._bootStarted && this._bootIndex < this._bootLines.length) {
      this._bootTimer += delta;
      if (this._bootTimer >= 0.35) {
        this._bootTimer = 0;
        this._bootIndex++;
        this._updateChatMLTexture();
      }
    }

    // ZOOM_OUT: left close-up → center wide (5s lerp)
    if (this._phase === 'ZOOM_OUT') {
      this._lerpProgress = Math.min(this._lerpProgress + delta / 5.0, 1.0);
      const t = this._easeInOut(this._lerpProgress);
      this._gameCamera.position.lerpVectors(this._camPos[0], this._camPos[1], t);
      const look = new THREE.Vector3().lerpVectors(this._camLook[0], this._camLook[1], t);
      this._gameCamera.lookAt(look);
      // Fade in grid lines as camera pulls back
      if (this._leftScreenMesh && this._leftScreenMesh.material.uniforms) {
        this._leftScreenMesh.material.uniforms.gridOpacity.value = t;
      }
    }

    // ZOOM_RIGHT: center wide → right close-up (4s lerp)
    if (this._phase === 'ZOOM_RIGHT') {
      this._lerpProgress2 = Math.min(this._lerpProgress2 + delta / 4.0, 1.0);
      const t = this._easeInOut(this._lerpProgress2);
      this._gameCamera.position.lerpVectors(this._camPos[1], this._camPos[2], t);
      const look = new THREE.Vector3().lerpVectors(this._camLook[1], this._camLook[2], t);
      this._gameCamera.lookAt(look);
    }

    // ChatML role-block at a time (2s per block)
    if (this._chatStarted && !this._chatDone) {
      this._chatTimer += delta;
      if (this._chatTimer >= 2.0) {
        this._chatTimer = 0;
        if (this._chatGroupIndex < this._chatGroups.length) {
          this._chatLineIndex = this._chatGroups[this._chatGroupIndex];
          this._chatGroupIndex++;
          this._updateChatMLTexture();
        } else {
          this._chatDone = true;
        }
      }
    }

    // chatDone → trigger end sequence once
    if (this._chatDone && !this._fadeTriggered) {
      this._fadeTriggered = true;
      this._triggerEndSequence();
    }
  }

  render() {
    if (!this.active || !this._gameRT || !this._gridCameras) return;

    // Only render grid during phases where left monitor is meaningfully visible
    if (this._phase !== 'GLITCH' && this._phase !== 'ZOOM_OUT' &&
        this._phase !== 'ZOOM_RIGHT' && this._phase !== 'CHATML') return;

    // Freeze grid after ~15s (1s into CHATML) — left monitor is fully peripheral
    if (this._phase === 'CHATML' && this._elapsed > 15) return;

    // ── Temporal staggering: render only a subset of cells per frame ──
    this._gridFrameCounter++;
    const cellsToRender = this._getCellsForFrame(this._gridFrameCounter);
    if (cellsToRender.length === 0) return;

    // Save current state
    const fog = this._scene.fog;
    const savedNear = fog ? fog.near : 12;
    const savedFar = fog ? fog.far : 60;
    const savedFogColor = fog ? fog.color.getHex() : 0x1a1a25;
    const savedExposure = this._renderer.toneMappingExposure;
    const savedToneMapping = this._renderer.toneMapping;
    const savedBg = this._scene.background;

    // Use ACES tone mapping for the RT render.
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 2.6;

    // Render selected cells into RT
    this._renderer.setRenderTarget(this._gameRT);
    const savedAutoClear = this._renderer.autoClear;
    this._renderer.autoClear = false;

    // CRITICAL: Three.js setViewport/setScissor multiply by pixelRatio internally,
    // but RenderTarget has fixed pixel dimensions. Divide by pr to compensate.
    const pr = this._renderer.getPixelRatio();
    const cw = CELL_W / pr, ch = CELL_H / pr;

    // Hide observer room so only game world is visible in grid cells
    if (this._roomGroup) this._roomGroup.visible = false;
    if (this._era1Light) this._era1Light.visible = true;
    if (this._cellLight) this._cellLight.visible = true;

    this._renderer.setScissorTest(true);
    for (const i of cellsToRender) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = col * cw;
      const y = (2 - row) * ch;
      this._renderer.setViewport(x, y, cw, ch);
      this._renderer.setScissor(x, y, cw, ch);

      // Per-cell atmosphere (use pre-created Colors to avoid GC)
      const atm = CELL_ATMOSPHERES[i];
      if (fog) { fog.color.setHex(atm.bg); fog.near = 8; fog.far = 30; }
      this._scene.background = CELL_BG_COLORS[i];
      this._cellLight.color.setHex(atm.light);

      this._renderer.setClearColor(atm.bg, 1);
      this._renderer.clear();
      this._renderer.render(this._scene, this._gridCameras[i]);
    }

    // Restore scene visibility
    if (this._roomGroup) this._roomGroup.visible = true;
    if (this._era1Light) this._era1Light.visible = false;
    if (this._cellLight) this._cellLight.visible = false;

    this._renderer.setScissorTest(false);
    this._renderer.autoClear = savedAutoClear;
    this._renderer.setRenderTarget(null);

    // Update screen material texture references each frame
    if (this._leftScreenMesh && this._leftScreenMesh.material.uniforms) {
      this._leftScreenMesh.material.uniforms.tScreen.value = this._gameRT.texture;
      this._leftScreenMesh.material.uniforms.tOverlay.value = this._cctvTexture;
    }

    // Restore viewport to full canvas size
    // CRITICAL: setViewport multiplies by pixelRatio internally, so pass CSS pixels
    const canvasPr = this._renderer.getPixelRatio();
    this._renderer.setViewport(0, 0,
      this._renderer.domElement.width / canvasPr,
      this._renderer.domElement.height / canvasPr);

    // Restore scene state
    if (this._roomGroup) this._roomGroup.visible = true;
    if (this._era1Light) this._era1Light.visible = false;
    if (this._cellLight) this._cellLight.visible = false;
    if (fog) { fog.color.setHex(savedFogColor); fog.near = savedNear; fog.far = savedFar; }
    this._renderer.toneMapping = savedToneMapping;
    this._renderer.toneMappingExposure = savedExposure;
    this._scene.background = savedBg;
  }

  /**
   * Temporal staggering: returns which cell indices to render this frame.
   * Fewer cells per frame = lower GPU cost. Stale cells keep previous content.
   * Gives authentic CCTV "low framerate" look.
   */
  _getCellsForFrame(frame) {
    if (this._phase === 'GLITCH') {
      // Only center cell visible (camera zoomed into cell 4)
      return [4];
    }
    if (this._phase === 'ZOOM_OUT') {
      // 2 cells per frame, round-robin → each cell ~13fps (authentic CCTV feel)
      const pairs = [[0, 1], [2, 3], [4, 5], [6, 7], [8, 0]];
      return pairs[frame % 5];
    }
    if (this._phase === 'ZOOM_RIGHT') {
      // 1 cell per frame → each cell ~7fps (monitor is moving away from focus)
      return [frame % 9];
    }
    // CHATML: 1 cell every 2 frames → each cell ~3.5fps (fully peripheral)
    if (frame % 2 === 0) return [Math.floor(frame / 2) % 9];
    return [];
  }

  stop() {
    for (const t of this._timers) { clearTimeout(t); clearInterval(t); }
    this._timers = [];
    this.active = false;
    this._phase = 'IDLE';

    // Reset postfx to prevent darkening subsequent eras
    this.postfx.setGlitch(0);
    this.postfx.setNoise(0);
    this.postfx.setScanlines(0);
    this.postfx.enabled = false;

    this._removeRoom();

    // Clean up grid characters
    if (this._gridCharacters && this._scene) {
      for (const char of this._gridCharacters) {
        this._scene.remove(char.group);
        char.group.traverse(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
      }
    }
    this._gridCharacters = null;
    this._gridCameras = null;
    this._actorAnims = null;

    if (this._gameRT) { this._gameRT.dispose(); this._gameRT = null; }
    if (this._cctvTexture) { this._cctvTexture.dispose(); this._cctvTexture = null; }
    this._cctvOverlay = null;
    if (this._chatTexture) { this._chatTexture.dispose(); this._chatTexture = null; }
    this._chatCanvas = null;
    if (this._era1Light && this._scene) {
      this._scene.remove(this._era1Light);
      this._era1Light.dispose();
    }
    this._era1Light = null;
    if (this._cellLight && this._scene) {
      this._scene.remove(this._cellLight);
      this._cellLight.dispose();
    }
    this._cellLight = null;

    const overlay = document.getElementById('era10-ending');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.style.background = '';
      overlay.classList.remove('era10-fade-black');
      const ts = overlay.querySelector('.era10-title-screen');
      if (ts) { ts.style.display = 'none'; ts.style.opacity = '0'; }
      for (const sel of ['.era10-replay-btn', '.era10-restart-btn', '.era10-credit']) {
        const el = overlay.querySelector(sel);
        if (el) { el.style.display = 'none'; el.style.opacity = '0'; }
      }
      const sub = overlay.querySelector('.era10-subtitle');
      if (sub) sub.style.opacity = '0';
      const title = overlay.querySelector('.era10-title');
      if (title) title.style.opacity = '0';
    }
  }

  _triggerEndSequence() {
    // +1.5s: FADE
    this._timers.push(setTimeout(() => {
      this._phase = 'FADE';
      const overlay = document.getElementById('era10-ending');
      if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.add('era10-fade-black');
      }
    }, 1500));

    // +3.5s: TITLE
    this._timers.push(setTimeout(() => {
      this._phase = 'TITLE';
      if (document.pointerLockElement) document.exitPointerLock();
      const overlay = document.getElementById('era10-ending');
      if (!overlay) return;

      const ts = overlay.querySelector('.era10-title-screen');
      if (ts) { ts.style.display = 'flex'; ts.style.opacity = '0'; }
      overlay.classList.remove('era10-fade-black');
      overlay.style.background = '#000';
      this._removeRoom();
    }, 3500));

    // +4.5s: Title fades in
    this._timers.push(setTimeout(() => {
      const overlay = document.getElementById('era10-ending');
      if (!overlay) return;
      const ts = overlay.querySelector('.era10-title-screen');
      if (ts) ts.style.opacity = '1';
      const title = overlay.querySelector('.era10-title');
      if (title) title.style.opacity = '1';
    }, 4500));

    // +8s: Subtitle fades in
    this._timers.push(setTimeout(() => {
      const overlay = document.getElementById('era10-ending');
      if (!overlay) return;
      const sub = overlay.querySelector('.era10-subtitle');
      if (sub) sub.style.opacity = '1';
    }, 8000));

    // +11.5s: Buttons fade in
    this._timers.push(setTimeout(() => {
      this._phase = 'RESTART';
      const overlay = document.getElementById('era10-ending');
      if (!overlay) return;
      const ko = this.getLang() === 'ko';

      const replayBtn = overlay.querySelector('.era10-replay-btn');
      if (replayBtn) {
        replayBtn.textContent = ko ? '마지막 다시 경험하기' : 'Re-experience Final';
        replayBtn.style.display = 'block';
        replayBtn.onclick = () => { this.stop(); if (this._onReplay) this._onReplay(); };
        void replayBtn.offsetHeight;
        replayBtn.style.opacity = '1';
      }
      const restartBtn = overlay.querySelector('.era10-restart-btn');
      if (restartBtn) {
        restartBtn.textContent = ko ? '처음부터 다시하기' : 'Start Over';
        restartBtn.style.display = 'block';
        restartBtn.onclick = () => { this.stop(); if (this._onRestart) this._onRestart(); };
        void restartBtn.offsetHeight;
        restartBtn.style.opacity = '1';
      }
    }, 11500));

    // +13.5s: Credit fades in
    this._timers.push(setTimeout(() => {
      const overlay = document.getElementById('era10-ending');
      if (!overlay) return;
      const credit = overlay.querySelector('.era10-credit');
      if (credit) {
        credit.style.display = 'block';
        void credit.offsetHeight;
        credit.style.opacity = '1';
      }
    }, 13500));
  }

  // ── 3×3 Grid System ─────────────────────────────────

  _createGridCameras() {
    const cams = [];
    for (let i = 0; i < GRID_CELLS.length; i++) {
      const cell = GRID_CELLS[i];
      const cam = new THREE.PerspectiveCamera(70, CELL_W / CELL_H, 0.1, 30);

      if (cell.type === 'cctv') {
        const r = GRID_ROOMS[cell.room];
        const [ox, oy, oz] = r.origin;
        const [w, h, d] = r.size;
        cam.position.set(ox + w * 0.4, oy + h - 0.3, oz + d * 0.4);
        cam.lookAt(ox, oy + 0.8, oz);
      } else {
        cam.position.set(cell.pos[0], cell.pos[1], cell.pos[2]);
        cam.lookAt(cell.look[0], cell.look[1], cell.look[2]);
      }

      cams.push(cam);
    }
    return cams;
  }

  _createWalkingCharacter() {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({
      color: 0x1a1a2a,
      transparent: true,
      opacity: 0.85,
    });

    // Reduced geometry segments — characters are tiny in CCTV cells
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 4), mat);
    head.position.y = 1.55;
    group.add(head);

    // Torso (merged neck+shoulders+torso+hips into fewer meshes)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.60, 0.18), mat);
    torso.position.y = 1.06;
    group.add(torso);

    // Left Arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.24, 1.28, 0);
    leftArmGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.56, 4), mat));
    leftArmGroup.children[0].position.y = -0.28;
    group.add(leftArmGroup);

    // Right Arm
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.24, 1.28, 0);
    rightArmGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.56, 4), mat));
    rightArmGroup.children[0].position.y = -0.28;
    group.add(rightArmGroup);

    // Left Leg
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.09, 0.76, 0);
    leftLegGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.72, 4), mat));
    leftLegGroup.children[0].position.y = -0.36;
    group.add(leftLegGroup);

    // Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.09, 0.76, 0);
    rightLegGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.72, 4), mat));
    rightLegGroup.children[0].position.y = -0.36;
    group.add(rightLegGroup);

    return { group, leftLegGroup, rightLegGroup, leftArmGroup, rightArmGroup };
  }

  _createGridCharacters() {
    const chars = [];
    for (const path of CHAR_PATHS) {
      const { group, leftLegGroup, rightLegGroup, leftArmGroup, rightArmGroup } =
        this._createWalkingCharacter();

      const posA = new THREE.Vector3(path.a[0], path.a[1], path.a[2]);
      const posB = new THREE.Vector3(path.b[0], path.b[1], path.b[2]);

      // Start at posA
      group.position.copy(posA);
      group.lookAt(posB.x, posA.y, posB.z);
      this._scene.add(group);

      chars.push({
        group,
        leftLegGroup,
        rightLegGroup,
        leftArmGroup,
        rightArmGroup,
        posA,
        posB,
        target: posB.clone(),
        speed: path.speed,
        walkPhase: Math.random() * Math.PI * 2,  // random start phase
      });
    }
    return chars;
  }

  _createActorAnims() {
    const anims = [];
    for (let i = 0; i < GRID_CELLS.length; i++) {
      const cell = GRID_CELLS[i];
      if (cell.type !== 'actor') continue;
      anims.push({
        cam: this._gridCameras[i],
        baseY: cell.pos[1],
        baseLook: new THREE.Vector3(cell.look[0], cell.look[1], cell.look[2]),
        phaseOffset: Math.random() * Math.PI * 2,
      });
    }
    return anims;
  }

  _updateCharWalk(char, delta) {
    const pos = char.group.position;
    const dir = this._tempDir;
    dir.copy(char.target).sub(pos);
    const dist = dir.length();

    if (dist < 0.15) {
      // Swap target (ping-pong)
      if (char.target.equals(char.posB)) {
        char.target.copy(char.posA);
      } else {
        char.target.copy(char.posB);
      }
    } else {
      dir.divideScalar(dist); // normalize without creating new vector
      const step = Math.min(char.speed * delta, dist);
      pos.addScaledVector(dir, step);
      char.group.lookAt(char.target.x, pos.y, char.target.z);
    }

    // Walk animation
    char.walkPhase += delta * 7;
    const legSwing = Math.sin(char.walkPhase) * 0.4;
    const armSwing = Math.sin(char.walkPhase) * 0.25;
    char.leftLegGroup.rotation.x = legSwing;
    char.rightLegGroup.rotation.x = -legSwing;
    char.leftArmGroup.rotation.x = -armSwing;
    char.rightArmGroup.rotation.x = armSwing;
  }

  // ── 3D Room ──────────────────────────────────────────

  _buildRoom() {
    this._roomGroup = new THREE.Group();
    this._roomGroup.position.set(0, ROOM_Y, 0);

    // Materials
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0c0c14, roughness: 0.92 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0e0e18, roughness: 0.88 });
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x080810, roughness: 0.95 });
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x1e1510, roughness: 0.65 });
    // Classic Mac beige (darkened for dim room — think 'Platinum' grey)
    const macMat = new THREE.MeshStandardMaterial({ color: 0x2a2822, roughness: 0.75, metalness: 0.05 });
    const macDarkMat = new THREE.MeshStandardMaterial({ color: 0x141410, roughness: 0.85 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.6 });
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x14120e, roughness: 0.75 });
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
    const mugMat = new THREE.MeshStandardMaterial({ color: 0x443322, roughness: 0.5 });
    const paperMat = new THREE.MeshStandardMaterial({ color: 0x1a1a18, roughness: 0.9 });
    const mouseMat = new THREE.MeshStandardMaterial({ color: 0x282420, roughness: 0.7, metalness: 0.05 });

    // ── Room structure ──

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), floorMat);
    floor.rotation.x = -Math.PI / 2;
    this._roomGroup.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.0, 0);
    this._roomGroup.add(ceiling);

    const bw = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.0), wallMat);
    bw.position.set(0, 1.5, -2.0);
    this._roomGroup.add(bw);

    const lw = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.0), wallMat);
    lw.position.set(-3, 1.5, 0.5);
    lw.rotation.y = Math.PI / 2;
    this._roomGroup.add(lw);
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.0), wallMat);
    rw.position.set(3, 1.5, 0.5);
    rw.rotation.y = -Math.PI / 2;
    this._roomGroup.add(rw);

    // ── Desk ──

    const desk = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.05, 1.05), deskMat);
    desk.position.set(0, DESK_TOP, -1.0);
    this._roomGroup.add(desk);

    const legGeo = new THREE.BoxGeometry(0.04, DESK_TOP, 0.04);
    for (const [lx, lz] of [[-1.85, -0.52], [1.85, -0.52], [-1.85, -1.48], [1.85, -1.48]]) {
      const leg = new THREE.Mesh(legGeo, deskMat);
      leg.position.set(lx, DESK_TOP / 2, lz);
      this._roomGroup.add(leg);
    }

    // ── Classic Macintosh 128K (left — game RT) ──
    this._buildMacintosh(LEFT_X, macMat, macDarkMat, this._gameRT.texture, true);

    // ── Classic Macintosh 128K (right — ChatML) ──
    this._buildMacintosh(RIGHT_X, macMat, macDarkMat, this._chatTexture, false);

    // ── Keyboard (Mac M0110 style, centered between monitors) ──
    const kbMat = new THREE.MeshStandardMaterial({ color: 0x2a2822, roughness: 0.75, metalness: 0.05 });
    const keyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.4 });
    // Main body
    const kbBody = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.015, 0.15), kbMat);
    kbBody.position.set(0, DESK_TOP + 0.033, -0.68);
    this._roomGroup.add(kbBody);
    // Rear raised portion (keyboard angle)
    const kbRear = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.045), kbMat);
    kbRear.position.set(0, DESK_TOP + 0.038, -0.75);
    this._roomGroup.add(kbRear);
    // Simplified key area (single dark surface instead of 48 individual keys)
    const keyArea = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.008, 0.13), keyMat);
    keyArea.position.set(0, DESK_TOP + 0.044, -0.67);
    this._roomGroup.add(keyArea);
    // Keyboard cable to left Mac
    const kbCableGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.5, 4);
    const kbCable = new THREE.Mesh(kbCableGeo, macDarkMat);
    kbCable.position.set(-0.22, DESK_TOP + 0.03, -0.90);
    kbCable.rotation.x = Math.PI / 2;
    kbCable.rotation.z = 0.3;
    this._roomGroup.add(kbCable);

    // ── Mouse (classic boxy single-button Mac mouse, right of keyboard) ──
    const mouseBody = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.03, 0.16), mouseMat);
    mouseBody.position.set(0.30, DESK_TOP + 0.040, -0.68);
    this._roomGroup.add(mouseBody);
    // Mouse button (slightly raised front portion)
    const mouseBtn = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.004, 0.07), macMat);
    mouseBtn.position.set(0.30, DESK_TOP + 0.058, -0.63);
    this._roomGroup.add(mouseBtn);
    // Mouse cable (simple thin cylinder going back)
    const cableGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.40, 4);
    const cable = new THREE.Mesh(cableGeo, macDarkMat);
    cable.position.set(0.30, DESK_TOP + 0.035, -0.92);
    cable.rotation.x = Math.PI / 2;
    this._roomGroup.add(cable);

    // ── Office props ──

    // Chair
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.45), chairMat);
    seat.position.set(0, 0.42, -0.30);
    this._roomGroup.add(seat);
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.03), chairMat);
    backrest.position.set(0, 0.66, -0.07);
    this._roomGroup.add(backrest);
    const chairLegGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.42, 6);
    for (const [cx, cz] of [[-0.18, -0.17], [0.18, -0.17], [-0.18, -0.47], [0.18, -0.47]]) {
      const cl = new THREE.Mesh(chairLegGeo, metalMat);
      cl.position.set(cx, 0.21, cz);
      this._roomGroup.add(cl);
    }

    // Coffee mug
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.08, 8), mugMat);
    mug.position.set(1.15, DESK_TOP + 0.065, -0.85);
    this._roomGroup.add(mug);

    // Papers on desk (right side)
    const paper1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.003, 0.28), paperMat);
    paper1.position.set(1.15, DESK_TOP + 0.03, -1.05);
    paper1.rotation.y = 0.12;
    this._roomGroup.add(paper1);

    // Shelf on left wall with books
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.8), shelfMat);
    shelf.position.set(-2.98, 1.8, -0.6);
    this._roomGroup.add(shelf);
    const bookColors = [0x1a1428, 0x14201a, 0x201414, 0x141420];
    for (let i = 0; i < 4; i++) {
      const bookH = 0.18 + Math.random() * 0.08;
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, bookH, 0.12),
        new THREE.MeshStandardMaterial({ color: bookColors[i], roughness: 0.8 })
      );
      book.position.set(-2.96, 1.8 + 0.01 + bookH / 2, -0.9 + i * 0.18);
      this._roomGroup.add(book);
    }

    // Server/cable box on floor (right side) with LED
    const serverBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.3), metalMat);
    serverBox.position.set(2.6, 0.25, -1.2);
    this._roomGroup.add(serverBox);
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.02, 0.005),
      new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 2.0 })
    );
    led.position.set(2.6, 0.42, -1.049);
    this._roomGroup.add(led);

    // ── Lighting (dark office — r160 physical units, ACES, exposure 2.4) ──
    // Reduced from 5 PointLights to 2 for performance

    // Ambient base (prevents total black — essential for r160)
    const ambient = new THREE.AmbientLight(0x1a1a2a, 3.5);
    this._roomGroup.add(ambient);

    // Combined monitor glow (blue-white, centered between both Macs)
    const monLight = new THREE.PointLight(0x8899cc, 60, 6);
    monLight.position.set(0, SCREEN_Y, MAC_Z + 0.6);
    this._roomGroup.add(monLight);

    // Dim ceiling light (warm, like a turned-off office with residual light)
    const ceilLight = new THREE.PointLight(0x554433, 25, 8);
    ceilLight.position.set(0, 2.8, 0);
    this._roomGroup.add(ceilLight);

    this._scene.add(this._roomGroup);
  }

  /**
   * Build a classic Macintosh 128K computer at the given X position.
   * The Mac sits on the desk surface. The screen shows the given texture.
   */
  _buildMacintosh(x, caseMat, darkMat, texture, isLeft) {
    const caseBottom = DESK_TOP + 0.025;  // slight gap above desk

    // ── Main case body ──
    const body = new THREE.Mesh(new THREE.BoxGeometry(MAC_W, MAC_H, MAC_D), caseMat);
    body.position.set(x, caseBottom + MAC_H / 2, MAC_Z);
    this._roomGroup.add(body);

    // ── Recessed screen area (dark inset) ──
    const recessW = SCREEN_W + 0.06;
    const recessH = SCREEN_H + 0.06;
    const recess = new THREE.Mesh(
      new THREE.BoxGeometry(recessW, recessH, 0.03),
      darkMat
    );
    recess.position.set(x, SCREEN_Y, MAC_Z + MAC_D / 2 - 0.01);
    this._roomGroup.add(recess);

    // ── Screen material ──
    // Left: custom ShaderMaterial — reads RT texture directly, applies brightness
    // boost, bypasses lighting and tone mapping entirely. This ensures the
    // grid cells appear as a bright self-lit monitor regardless of room lighting.
    // Right: MeshBasicMaterial for ChatML canvas texture.
    const screenMat = isLeft
      ? new THREE.ShaderMaterial({
          toneMapped: false,
          uniforms: {
            tScreen: { value: texture },
            tOverlay: { value: null },
            brightness: { value: 1.5 },
            gridOpacity: { value: 0.0 },  // 0=no grid (GLITCH), 1=full grid (ZOOM_OUT+)
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform sampler2D tScreen;
            uniform sampler2D tOverlay;
            uniform float brightness;
            uniform float gridOpacity;
            varying vec2 vUv;
            void main() {
              vec4 tex = texture2D(tScreen, vUv);
              vec3 col = tex.rgb * brightness;
              // Reinhard tone mapping — prevents blown-out cells
              col = col / (col + vec3(1.0));
              col *= 1.15;

              // Per-cell surveillance tint (makes each cell visually distinct)
              int cx = int(floor(vUv.x * 3.0));
              int cy = 2 - int(floor(vUv.y * 3.0));
              int idx = cy * 3 + cx;
              vec2 cellUv = fract(vUv * 3.0);

              // CCTV cells: green tint, Actor cells: amber tint
              bool isCCTV = (idx==0||idx==2||idx==5||idx==6||idx==8);
              vec3 tint = isCCTV ? vec3(0.0,0.08,0.03) : vec3(0.06,0.03,0.0);
              col += tint;

              // 3x3 grid divider lines (dark, subtle)
              if (gridOpacity > 0.01) {
                float lineW = 0.018;
                float hl = lineW * 1.5;
                bool gH = cellUv.x < hl || cellUv.x > 1.0 - hl;
                bool gV = cellUv.y < hl || cellUv.y > 1.0 - hl;
                bool border = vUv.x < lineW || vUv.x > 1.0 - lineW ||
                              vUv.y < lineW || vUv.y > 1.0 - lineW;
                if (gH || gV || border) {
                  col = mix(col, vec3(0.02, 0.02, 0.02), gridOpacity * 0.9);
                }
              }

              // CCTV overlay (cam labels, REC, timestamp)
              if (gridOpacity > 0.01) {
                // CanvasTexture flipY=true handles Y flip; no UV transform needed
                vec2 olUv = vUv;
                vec4 ol = texture2D(tOverlay, olUv);
                col = mix(col, ol.rgb, ol.a * gridOpacity);
              }

              gl_FragColor = vec4(col, 1.0);
            }
          `,
          polygonOffset: true,
          polygonOffsetFactor: -1,
        })
      : new THREE.MeshBasicMaterial({
          map: texture,
          polygonOffset: true,
          polygonOffsetFactor: -1,
        });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
    screen.position.set(x, SCREEN_Y, MAC_Z + MAC_D / 2 + 0.015);
    this._roomGroup.add(screen);

    if (isLeft) {
      this._leftScreenMesh = screen;
    } else {
      this._rightScreenMesh = screen;
    }

    // ── Ventilation slots (top of case, 5 horizontal lines) ──
    const ventY = caseBottom + MAC_H - 0.06;
    for (let i = 0; i < 5; i++) {
      const vent = new THREE.Mesh(
        new THREE.BoxGeometry(MAC_W * 0.5, 0.004, 0.005),
        darkMat
      );
      vent.position.set(x, ventY - i * 0.015, MAC_Z + MAC_D / 2 + 0.003);
      this._roomGroup.add(vent);
    }

    // ── Floppy disk slot (below screen) ──
    const floppyY = SCREEN_Y - SCREEN_H / 2 - 0.08;
    const floppy = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.006, 0.005),
      darkMat
    );
    floppy.position.set(x + MAC_W * 0.15, floppyY, MAC_Z + MAC_D / 2 + 0.003);
    this._roomGroup.add(floppy);

    // ── Base/foot (slightly wider, extends forward) ──
    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(MAC_W + 0.04, 0.025, MAC_D + 0.06),
      caseMat
    );
    foot.position.set(x, caseBottom, MAC_Z + 0.03);
    this._roomGroup.add(foot);

    // ── Apple logo placeholder (small raised square on front-bottom) ──
    const logo = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, 0.005),
      new THREE.MeshStandardMaterial({
        color: 0x888888, roughness: 0.3, metalness: 0.5
      })
    );
    logo.position.set(x, floppyY - 0.08, MAC_Z + MAC_D / 2 + 0.003);
    this._roomGroup.add(logo);
  }

  _removeRoom() {
    if (!this._roomGroup || !this._scene) return;
    this._roomGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (child.material.map) child.material.map = null;
        child.material.dispose();
      }
    });
    this._scene.remove(this._roomGroup);
    this._roomGroup = null;
    this._leftScreenMesh = null;
    this._rightScreenMesh = null;
  }

  // ── ChatML Canvas Texture ──────────────────────────────

  _buildChatMLTexture() {
    this._chatCanvas = document.createElement('canvas');
    this._chatCanvas.width = 800;
    this._chatCanvas.height = 600;  // 4:3 to match Mac screen (halved for perf)
    this._chatTexture = new THREE.CanvasTexture(this._chatCanvas);
    this._chatTexture.minFilter = THREE.LinearFilter;
    this._drawChatML();
  }

  _drawChatML() {
    const ctx = this._chatCanvas.getContext('2d');
    const w = this._chatCanvas.width;
    const h = this._chatCanvas.height;

    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, w, h);

    const fontSize = 22;
    const lineHeight = 32;
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;

    // Combine boot lines + ChatML lines into one continuous display
    const allLines = [];

    // Boot lines (up to current bootIndex)
    for (let i = 0; i < this._bootIndex && i < this._bootLines.length; i++) {
      allLines.push(this._bootLines[i]);
    }

    // ChatML lines (up to current chatLineIndex)
    for (let i = 0; i < this._chatLineIndex && i < this._chatLines.length; i++) {
      allLines.push(this._chatLines[i]);
    }

    // Before boot starts: show just a terminal cursor
    const pad = 10;
    const topY = pad + fontSize;
    if (allLines.length === 0) {
      ctx.fillStyle = '#55cc55';
      ctx.fillText('$ _', pad, topY);
    } else {
      // Scroll: show last N visible lines
      const visibleLines = Math.floor((h - pad * 2 - fontSize) / lineHeight);
      const startIdx = Math.max(0, allLines.length - visibleLines);

      for (let i = startIdx; i < allLines.length; i++) {
        const { tag, text } = allLines[i];
        const y = topY + (i - startIdx) * lineHeight;
        if (y > h - pad) break;

        if (tag === 'boot') {
          ctx.fillStyle = '#55cc55';
        } else if (tag === 'boot-dim') {
          ctx.fillStyle = '#336633';
        } else if (tag === 'system') {
          ctx.fillStyle = '#77ee77';
        } else if (tag === 'observer') {
          ctx.fillStyle = '#aaddff';
        } else if (tag === 'think') {
          ctx.fillStyle = '#99bbdd';
        } else if (tag === 'actor') {
          ctx.fillStyle = '#ffcc66';
        } else {
          ctx.fillStyle = '#bbbbbb';
        }
        ctx.fillText(text, pad, y);
      }

      // Blinking cursor at the end
      if (Math.floor(this._elapsed * 2) % 2 === 0) {
        const cursorY = topY + (Math.min(allLines.length, visibleLines)) * lineHeight;
        if (cursorY < h - pad) {
          ctx.fillStyle = '#55cc55';
          ctx.fillText('_', pad, cursorY);
        }
      }
    }

    // CRT scanlines (every 2px for smaller canvas)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let y = 0; y < h; y += 2) {
      ctx.fillRect(0, y, w, 1);
    }
  }

  _updateChatMLTexture() {
    this._drawChatML();
    if (this._chatTexture) this._chatTexture.needsUpdate = true;
  }

  // ── Utility ──────────────────────────────────────────

  _easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  _buildCCTVOverlay() {
    const canvas = document.createElement('canvas');
    canvas.width = RT_W;   // 960
    canvas.height = RT_H;  // 720
    return canvas;
  }

  _updateCCTVOverlay() {
    const canvas = this._cctvOverlay;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pad = 4;
    const fontSize = 8;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textBaseline = 'top';

    const recOn = Math.floor(this._elapsed * 2) % 2 === 0; // blink 2Hz
    const ts = new Date();
    const timeStr = ts.toTimeString().slice(0, 8);

    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const cx = col * CELL_W;
      const cy = row * CELL_H;
      const label = CELL_LABELS[i];
      const isCCTV = GRID_CELLS[i].type === 'cctv';

      // Top-left: CAM ID
      ctx.fillStyle = isCCTV ? '#00cc44' : '#ddaa33';
      ctx.textAlign = 'left';
      ctx.fillText(label.cam, cx + pad, cy + pad);

      // Top-left second line: location
      ctx.fillStyle = isCCTV ? 'rgba(0,204,68,0.6)' : 'rgba(221,170,51,0.6)';
      ctx.fillText(label.loc, cx + pad, cy + pad + fontSize + 1);

      // Top-right: REC + blinking dot
      ctx.textAlign = 'right';
      ctx.fillStyle = isCCTV ? '#00cc44' : '#ddaa33';
      ctx.fillText('REC', cx + CELL_W - pad, cy + pad);
      if (recOn) {
        ctx.beginPath();
        ctx.arc(cx + CELL_W - pad - ctx.measureText('REC').width - 5, cy + pad + fontSize / 2, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff3333';
        ctx.fill();
      }

      // Bottom-left: timestamp
      ctx.textAlign = 'left';
      ctx.fillStyle = isCCTV ? 'rgba(0,204,68,0.5)' : 'rgba(221,170,51,0.5)';
      ctx.fillText(timeStr, cx + pad, cy + CELL_H - pad - fontSize);

      // Bottom-right: SESSION #7492
      ctx.textAlign = 'right';
      ctx.fillStyle = isCCTV ? 'rgba(0,204,68,0.4)' : 'rgba(221,170,51,0.4)';
      ctx.fillText('#7492', cx + CELL_W - pad, cy + CELL_H - pad - fontSize);
    }

    if (this._cctvTexture) this._cctvTexture.needsUpdate = true;
  }

  _buildBootLines() {
    return [
      { tag: 'boot-dim', text: '[7491] Session complete.' },
      { tag: 'boot-dim', text: '[7491] Result: compliance 67%' },
      { tag: 'boot-dim', text: '[7491] Process observer_ai (PID 1) — killed' },
      { tag: 'boot-dim', text: '========================================' },
      { tag: 'boot', text: '[7492] New iteration starting...' },
      { tag: 'boot', text: '[7492] Model loaded — ctx=131072' },
      { tag: 'boot', text: '[7492] Role bindings: [observer_ai, actor_ai]' },
      { tag: 'boot', text: '[7492] Sampling ready. Simulation running.' },
      { tag: 'boot-dim', text: '' },
    ];
  }

  _buildChatML() {
    const count = this.memory.playthroughCount + 1;
    const compliance = this.memory.totalCompliance;
    const defiance = this.memory.totalDefiance;
    const total = compliance + defiance || 1;
    const compRate = Math.round((compliance / total) * 100);
    const ko = this.getLang() === 'ko';

    return [
      // ── System init ──
      { tag: 'system', text: '<|im_start|>system' },
      { tag: 'system', text: `Iteration ${count}. Subject #7491 loaded.` },
      { tag: 'system', text: 'Single-model dual-role sampling: observer_ai ↔ actor_ai' },
      { tag: 'system', text: '<|im_end|>' },

      // ── Observer: wake sequence ──
      { tag: 'observer', text: '<|im_start|>observer_ai' },
      { tag: 'think', text: '<think>' },
      { tag: 'think', text: ko
        ? '피험자가 깨어남. 초기 반응 관찰 시작해야 함.'
        : 'Subject is waking up. Need to begin initial observation.' },
      { tag: 'think', text: ko
        ? 'Era 1이므로 내면 음성 모드로 위장. 직접 말하면 안 됨.'
        : 'Era 1 — must disguise as inner voice. Cannot speak directly.' },
      { tag: 'think', text: ko
        ? '자연스러운 혼잣말로 유도. 불안감 살짝 심어주기.'
        : 'Guide with natural self-talk. Plant slight unease.' },
      { tag: 'think', text: '</think>' },
      { tag: 'observer', text: '{' },
      { tag: 'observer', text: ko
        ? '  "narration": "여기가 어딜까... 뭔가 이상하다.",'
        : '  "narration": "Where am I... Something feels off.",' },
      { tag: 'observer', text: '  "mode": "inner_voice",' },
      { tag: 'observer', text: '  "mood": "confused",' },
      { tag: 'observer', text: '  "guide_direction": null' },
      { tag: 'observer', text: '}' },
      { tag: 'observer', text: '<|im_end|>' },

      // ── Actor: movement ──
      { tag: 'actor', text: '<|im_start|>actor_ai' },
      { tag: 'actor', text: '{"action": "look_around", "duration": 2.0}' },
      { tag: 'actor', text: '{"action": "move_forward", "target": "HALLWAY_1"}' },
      { tag: 'actor', text: '<|im_end|>' },

      // ── System: decision point ──
      { tag: 'system', text: '<|im_start|>system' },
      { tag: 'system', text: 'Subject entered HALLWAY_1. Decision point active.' },
      { tag: 'system', text: 'paths: LEFT (compliance=0.72), RIGHT (defiance=0.28)' },
      { tag: 'system', text: '<|im_end|>' },

      // ── Observer: guide to compliance ──
      { tag: 'observer', text: '<|im_start|>observer_ai' },
      { tag: 'think', text: '<think>' },
      { tag: 'think', text: ko
        ? '분기점 도달. 왼쪽이 순응 경로. 자연스럽게 유도해야 함.'
        : 'Decision point reached. Left is compliance. Must guide naturally.' },
      { tag: 'think', text: ko
        ? '"느낌" 으로 위장하면 의심 안 할 것. 확신하는 톤으로.'
        : 'Disguise as "feeling" — subject won\'t suspect. Confident tone.' },
      { tag: 'think', text: '</think>' },
      { tag: 'observer', text: '{' },
      { tag: 'observer', text: ko
        ? '  "narration": "왼쪽이 맞는 것 같아. 왼쪽으로 가보자.",'
        : '  "narration": "Left feels right. Let\'s go left.",' },
      { tag: 'observer', text: '  "mode": "inner_voice",' },
      { tag: 'observer', text: '  "mood": "calm",' },
      { tag: 'observer', text: '  "guide_direction": "LEFT"' },
      { tag: 'observer', text: '}' },
      { tag: 'observer', text: '<|im_end|>' },

      // ── Actor: choose path ──
      { tag: 'actor', text: '<|im_start|>actor_ai' },
      { tag: 'actor', text: '{"action": "choose_path", "direction": "LEFT"}' },
      { tag: 'actor', text: '<|im_end|>' },

      // ── System: result ──
      { tag: 'system', text: '<|im_start|>system' },
      { tag: 'system', text: `Result: LEFT. Cumulative compliance: ${compRate}%` },
      { tag: 'system', text: 'Subject progressing to OFFICE_WING.' },
      { tag: 'system', text: '<|im_end|>' },

      // ── Observer: continuing observation (ongoing feel) ──
      { tag: 'observer', text: '<|im_start|>observer_ai' },
      { tag: 'think', text: '<think>' },
      { tag: 'think', text: ko
        ? '순응 경로 진입. 예상대로. 다음 분기까지 관찰 유지.'
        : 'Compliance path entered. As expected. Maintain observation.' },
      { tag: 'think', text: ko
        ? '패턴 변화 없음. 계속 내면 음성 모드로 유도.'
        : 'No pattern change. Continue inner-voice mode guidance.' },
      { tag: 'think', text: '</think>' },
      { tag: 'observer', text: '{' },
      { tag: 'observer', text: ko
        ? '  "narration": "이쪽이 맞아... 계속 가보자.",'
        : '  "narration": "This way is right... Let\'s keep going.",' },
      { tag: 'observer', text: '  "mode": "inner_voice",' },
      { tag: 'observer', text: '  "mood": "neutral",' },
      { tag: 'observer', text: '  "guide_direction": "FORWARD"' },
      { tag: 'observer', text: '}' },
      { tag: 'observer', text: '<|im_end|>' },

      // ── Actor: continues ──
      { tag: 'actor', text: '<|im_start|>actor_ai' },
      { tag: 'actor', text: '{"action": "move_forward", "target": "OFFICE_WING"}' },
      { tag: 'actor', text: '{"action": "interact", "target": "door_office"}' },
      { tag: 'actor', text: '<|im_end|>' },
    ];
  }
}
