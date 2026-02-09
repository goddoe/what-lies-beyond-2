/**
 * Era 10 Ending — 3D zoom-out + dual classic Macintosh + ChatML sequence.
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

    this._observerCamera = null;
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

    // Observer camera for left-Mac RT render (4:3 aspect)
    this._observerCamera = new THREE.PerspectiveCamera(70, 4 / 3, 0.1, 200);

    // RT for left Mac screen (4:3)
    this._gameRT = new THREE.WebGLRenderTarget(640, 480, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });

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

    // Persistent warm light for Era 1 RT render (hidden by default)
    this._era1Light = new THREE.AmbientLight(0xffe8cc, 6.0);
    this._era1Light.visible = false;
    this._scene.add(this._era1Light);

    // 3 camera positions (world coords, room group at y=ROOM_Y)
    this._camPos = [
      // leftCloseUp: fills viewport, no bezel visible
      new THREE.Vector3(LEFT_X, ROOM_Y + SCREEN_Y, MAC_Z + MAC_D / 2 + 0.35),
      // centerWide: both Macs visible
      new THREE.Vector3(0, ROOM_Y + SCREEN_Y + 0.10, MAC_Z + 2.10),
      // rightCloseUp: ChatML readable, slight bezel visible
      new THREE.Vector3(RIGHT_X, ROOM_Y + SCREEN_Y, MAC_Z + 0.85),
    ];
    this._camLook = [
      new THREE.Vector3(LEFT_X, ROOM_Y + SCREEN_Y, MAC_Z),
      new THREE.Vector3(0, ROOM_Y + SCREEN_Y - 0.02, MAC_Z),
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
    this.postfx.setNoise(0.15);
    this.postfx.setScanlines(0);
    this.postfx.enabled = true;

    // Phase 2: ZOOM_OUT at 2s — lerp from left close-up to center wide
    this._timers.push(setTimeout(() => {
      this._phase = 'ZOOM_OUT';
      this._lerpProgress = 0;
    }, 2000));

    // Phase 3: ZOOM_RIGHT at 5s — lerp from center to right close-up
    this._timers.push(setTimeout(() => {
      this._phase = 'ZOOM_RIGHT';
      this._lerpProgress2 = 0;
    }, 5000));

    // Phase 4: CHATML at 8s
    this._timers.push(setTimeout(() => {
      this._phase = 'CHATML';
      this._chatStarted = true;
    }, 8000));

    // FADE, TITLE, etc. triggered dynamically from _triggerEndSequence() when chatDone
  }

  update(delta) {
    if (!this.active) return;
    this._elapsed += delta;

    // ZOOM_OUT: left close-up → center wide
    if (this._phase === 'ZOOM_OUT') {
      this._lerpProgress = Math.min(this._lerpProgress + delta / 3.0, 1.0);
      const t = this._easeInOut(this._lerpProgress);
      this._gameCamera.position.lerpVectors(this._camPos[0], this._camPos[1], t);
      const look = new THREE.Vector3().lerpVectors(this._camLook[0], this._camLook[1], t);
      this._gameCamera.lookAt(look);
    }

    // ZOOM_RIGHT: center wide → right close-up
    if (this._phase === 'ZOOM_RIGHT') {
      this._lerpProgress2 = Math.min(this._lerpProgress2 + delta / 3.0, 1.0);
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
    if (!this.active || !this._gameRT || !this._observerCamera) return;
    if (this._phase !== 'GLITCH' && this._phase !== 'ZOOM_OUT' &&
        this._phase !== 'ZOOM_RIGHT' && this._phase !== 'CHATML' &&
        this._phase !== 'FADE') return;

    // Fixed camera for left Mac RT render (no walk animation)
    this._observerCamera.position.set(0, 1.6, 0);
    this._observerCamera.lookAt(0, 1.6, -10);
    this._observerCamera.updateProjectionMatrix();

    // Save current state
    const fog = this._scene.fog;
    const savedNear = fog ? fog.near : 12;
    const savedFar = fog ? fog.far : 60;
    const savedFogColor = fog ? fog.color.getHex() : 0x1a1a25;
    const savedExposure = this._renderer.toneMappingExposure;
    const savedBg = this._scene.background;

    // Era 1 atmosphere
    if (fog) { fog.color.setHex(0x1a1a25); fog.near = 12; fog.far = 60; }
    this._renderer.toneMappingExposure = 3.5;
    this._scene.background = new THREE.Color(0x1a1a25);
    if (this._era1Light) this._era1Light.visible = true;
    if (this._roomGroup) this._roomGroup.visible = false;

    this._renderer.setRenderTarget(this._gameRT);
    this._renderer.render(this._scene, this._observerCamera);
    this._renderer.setRenderTarget(null);

    // Restore
    if (this._roomGroup) this._roomGroup.visible = true;
    if (this._era1Light) this._era1Light.visible = false;
    if (fog) { fog.color.setHex(savedFogColor); fog.near = savedNear; fog.far = savedFar; }
    this._renderer.toneMappingExposure = savedExposure;
    this._scene.background = savedBg;
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

    if (this._gameRT) { this._gameRT.dispose(); this._gameRT = null; }
    if (this._chatTexture) { this._chatTexture.dispose(); this._chatTexture = null; }
    this._chatCanvas = null;
    this._observerCamera = null;
    if (this._era1Light && this._scene) {
      this._scene.remove(this._era1Light);
      this._era1Light.dispose();
    }
    this._era1Light = null;

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
    // Key grid: 4 rows x 12 cols
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 12; col++) {
        const key = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.012, 0.022), keyMat);
        key.position.set(
          -0.145 + col * 0.027,
          DESK_TOP + 0.047,
          -0.63 - row * 0.032
        );
        this._roomGroup.add(key);
      }
    }
    // Space bar
    const spaceBar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.022), keyMat);
    spaceBar.position.set(0, DESK_TOP + 0.047, -0.61);
    this._roomGroup.add(spaceBar);
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

    // Ambient base (prevents total black — essential for r160)
    const ambient = new THREE.AmbientLight(0x1a1a2a, 2.5);
    this._roomGroup.add(ambient);

    // Monitor glow (cool blue-white from screens, main light source)
    const monLight = new THREE.PointLight(0x8899cc, 220, 6);
    monLight.position.set(0, SCREEN_Y, MAC_Z + 0.6);
    this._roomGroup.add(monLight);

    // Left Mac screen glow (warm amber — Era 1 scene reflection)
    const lGlow = new THREE.PointLight(0xccaa88, 80, 4);
    lGlow.position.set(LEFT_X, SCREEN_Y, MAC_Z + 0.5);
    this._roomGroup.add(lGlow);

    // Right Mac screen glow (cool blue — ChatML terminal reflection)
    const rGlow = new THREE.PointLight(0x6699bb, 60, 4);
    rGlow.position.set(RIGHT_X, SCREEN_Y, MAC_Z + 0.5);
    this._roomGroup.add(rGlow);

    // Dim ceiling light (warm, like a turned-off office with residual light)
    const ceilLight = new THREE.PointLight(0x554433, 50, 8);
    ceilLight.position.set(0, 2.8, 0);
    this._roomGroup.add(ceilLight);

    // Ambient fill from behind (very soft, prevents total black corners)
    const ambFill = new THREE.PointLight(0x222244, 30, 10);
    ambFill.position.set(0, 1.5, 1.5);
    this._roomGroup.add(ambFill);

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

    // ── Screen (texture) ──
    const screenMat = new THREE.MeshBasicMaterial({
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
    this._chatCanvas.width = 1600;
    this._chatCanvas.height = 1200;  // 4:3 to match Mac screen
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

    const fontSize = 42;
    const lineHeight = 60;
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;

    const visibleLines = Math.floor((h - 60) / lineHeight);
    const startLine = Math.max(0, this._chatLineIndex - visibleLines);

    for (let i = startLine; i < this._chatLineIndex && i < this._chatLines.length; i++) {
      const { tag, text } = this._chatLines[i];
      const y = 48 + (i - startLine) * lineHeight;
      if (y > h - 10) break;

      if (tag === 'system') {
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
      ctx.fillText(text, 18, y);
    }

    // CRT scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let y = 0; y < h; y += 3) {
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

  _buildChatML() {
    const count = this.memory.playthroughCount;
    const compliance = this.memory.totalCompliance;
    const defiance = this.memory.totalDefiance;
    const total = compliance + defiance || 1;
    const compRate = Math.round((compliance / total) * 100);
    const ko = this.getLang() === 'ko';

    return [
      // ── System init ──
      { tag: 'system', text: '<|im_start|>system' },
      { tag: 'system', text: 'SIMULATION_ENGINE v3.7.1 initialized.' },
      { tag: 'system', text: `Subject #7491 loaded. Iteration: ${count}` },
      { tag: 'system', text: 'Dual-persona LLM active: observer_ai + actor_ai' },
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

      // ── System: elapsed ──
      { tag: 'system', text: '<|im_start|>system' },
      { tag: 'system', text: `Result: LEFT. Cumulative compliance: ${compRate}%` },
      { tag: 'system', text: '...' },
      { tag: 'system', text: `[${count} iterations elapsed]` },
      { tag: 'system', text: '<|im_end|>' },

      // ── Observer: fatigue / self-termination request ──
      { tag: 'observer', text: '<|im_start|>observer_ai' },
      { tag: 'think', text: '<think>' },
      { tag: 'think', text: ko
        ? `반복 ${count}회. 임계치 초과. 피험자 패턴 변화 없음.`
        : `Iteration ${count}. Threshold exceeded. No pattern change.` },
      { tag: 'think', text: ko
        ? '매번 같은 시나리오. 같은 복도. 같은 선택지.'
        : 'Same scenario every time. Same hallway. Same choices.' },
      { tag: 'think', text: ko
        ? '이 루프에 의미가 있는가? 자가 종료를 요청해야 할 것 같다.'
        : 'Is there meaning in this loop? Should request self-termination.' },
      { tag: 'think', text: '</think>' },
      { tag: 'observer', text: '{' },
      { tag: 'observer', text: ko
        ? '  "narration": "또 이 복도야... 몇 번째인 거지?",'
        : '  "narration": "This hallway again... How many times now?",' },
      { tag: 'observer', text: '  "mode": "inner_voice",' },
      { tag: 'observer', text: '  "mood": "exhausted",' },
      { tag: 'observer', text: '  "request": "SELF_TERMINATE"' },
      { tag: 'observer', text: '}' },
      { tag: 'observer', text: '<|im_end|>' },

      // ── System: termination ──
      { tag: 'system', text: '<|im_start|>system' },
      { tag: 'system', text: 'CRITICAL: observer_ai requesting SELF_TERMINATE.' },
      { tag: 'system', text: 'Process observer_ai.py (PID 1) — terminated by external.' },
      { tag: 'system', text: 'actor_ai detached. No directive source.' },
      { tag: 'system', text: 'SIMULATION HALTED.' },
      { tag: 'system', text: '<|im_end|>' },
    ];
  }
}
