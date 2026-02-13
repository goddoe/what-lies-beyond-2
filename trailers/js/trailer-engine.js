/**
 * Shared trailer engine — wraps Renderer, MapBuilder, PostFX for cinematic trailers.
 * Provides camera path interpolation, text overlay timing, and effect timelines.
 */

import { Renderer } from '../../js/engine/renderer.js';
import { MapBuilder } from '../../js/world/map-builder.js';
import { PostFX } from '../../js/engine/postfx.js';

// ── Scene Initialization ──────────────────────────────────

/**
 * Initialize a 3D scene for a trailer.
 * @param {HTMLCanvasElement} canvas
 * @param {number} era - 1-9
 * @param {object|null} variant
 * @returns {{ renderer: Renderer, mapBuilder: MapBuilder, postfx: PostFX, scene: THREE.Scene, camera: THREE.PerspectiveCamera }}
 */
export function initScene(canvas, era = 1, variant = null) {
  const renderer = new Renderer(canvas);
  const mapBuilder = new MapBuilder(renderer.scene);
  mapBuilder.build(era, variant);
  const postfx = new PostFX(renderer, renderer.scene, renderer.camera);
  return { renderer, mapBuilder, postfx, scene: renderer.scene, camera: renderer.camera };
}

// ── Camera Path ───────────────────────────────────────────

function lerpVec3(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function dist3(a, b) {
  const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function crScalar(p0, p1, p2, p3, t) {
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
  );
}

function crVec3(p0, p1, p2, p3, t) {
  return [
    crScalar(p0[0], p1[0], p2[0], p3[0], t),
    crScalar(p0[1], p1[1], p2[1], p3[1], t),
    crScalar(p0[2], p1[2], p2[2], p3[2], t),
  ];
}

/**
 * Keyframe-based camera animation.
 * keyframes: [{ time, pos:[x,y,z], lookAt:[x,y,z], fov? }]
 * opts.catmullRom: true for smooth Catmull-Rom spline (no stops at keyframes)
 */
export class CameraPath {
  constructor(keyframes, { catmullRom = false } = {}) {
    this.keyframes = keyframes.sort((a, b) => a.time - b.time);
    this.catmullRom = catmullRom;
  }

  update(elapsed, camera) {
    const kf = this.keyframes;
    if (kf.length === 0) return;

    // Before first keyframe
    if (elapsed <= kf[0].time) {
      camera.position.set(...kf[0].pos);
      camera.lookAt(...kf[0].lookAt);
      if (kf[0].fov) { camera.fov = kf[0].fov; camera.updateProjectionMatrix(); }
      return;
    }

    // After last keyframe
    if (elapsed >= kf[kf.length - 1].time) {
      const last = kf[kf.length - 1];
      camera.position.set(...last.pos);
      camera.lookAt(...last.lookAt);
      if (last.fov) { camera.fov = last.fov; camera.updateProjectionMatrix(); }
      return;
    }

    // Find segment
    for (let i = 0; i < kf.length - 1; i++) {
      if (elapsed >= kf[i].time && elapsed < kf[i + 1].time) {
        const rawT = (elapsed - kf[i].time) / (kf[i + 1].time - kf[i].time);

        let pos, lookAt;
        if (this.catmullRom) {
          // Catmull-Rom: smooth spline through keyframes, no velocity stops
          // Scene boundaries (pos gap > 15 units) get edge-clamped control points
          const p0 = this._safeCtrl(i - 1, i, kf);
          const p1 = kf[i];
          const p2 = kf[i + 1];
          const p3 = this._safeCtrl(i + 2, i + 1, kf);
          pos = crVec3(p0.pos, p1.pos, p2.pos, p3.pos, rawT);
          lookAt = crVec3(p0.lookAt, p1.lookAt, p2.lookAt, p3.lookAt, rawT);
        } else {
          // Smoothstep: ease-in-out per segment (stops at keyframes)
          const t = smoothstep(rawT);
          pos = lerpVec3(kf[i].pos, kf[i + 1].pos, t);
          lookAt = lerpVec3(kf[i].lookAt, kf[i + 1].lookAt, t);
        }

        camera.position.set(...pos);
        camera.lookAt(...lookAt);
        if (kf[i].fov && kf[i + 1].fov) {
          const ft = this.catmullRom ? rawT : smoothstep(rawT);
          camera.fov = kf[i].fov + (kf[i + 1].fov - kf[i].fov) * ft;
          camera.updateProjectionMatrix();
        }
        return;
      }
    }
  }

  /** Get a control point for Catmull-Rom, clamped at scene boundaries. */
  _safeCtrl(idx, fallbackIdx, kf) {
    if (idx < 0 || idx >= kf.length) return kf[fallbackIdx];
    if (dist3(kf[idx].pos, kf[fallbackIdx].pos) > 15) return kf[fallbackIdx];
    return kf[idx];
  }
}

// ── Text Timeline ─────────────────────────────────────────

/**
 * Timing-based text display with typing effect.
 * entries: [{ time, text, className, duration?, speed? }]
 */
export class TextTimeline {
  constructor(container, entries) {
    this.container = container;
    this.entries = entries.map(e => ({ ...e, fired: false }));
    this._typeTimer = null;
  }

  update(elapsed) {
    for (const entry of this.entries) {
      if (!entry.fired && elapsed >= entry.time) {
        entry.fired = true;
        this._showLine(entry);
      }
    }
  }

  _showLine(entry) {
    // Dim previous lines
    this.container.querySelectorAll('.narrator-line').forEach(l => l.classList.add('old'));

    const line = document.createElement('div');
    line.className = 'narrator-line ' + (entry.className || '');
    this.container.appendChild(line);

    this._typeText(entry.text, line, entry.speed || 35);

    // Auto-hide after duration
    if (entry.duration) {
      setTimeout(() => line.classList.add('hidden'), entry.duration);
    }
  }

  _typeText(text, el, speed) {
    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    el.textContent = '';
    el.appendChild(cursor);
    if (this._typeTimer) clearInterval(this._typeTimer);
    this._typeTimer = setInterval(() => {
      if (i < text.length) {
        el.insertBefore(document.createTextNode(text[i]), cursor);
        i++;
      } else {
        clearInterval(this._typeTimer);
        this._typeTimer = null;
        setTimeout(() => cursor.remove(), 300);
      }
    }, speed);
  }

  clear(fadeDuration = 500) {
    this.container.querySelectorAll('.narrator-line').forEach(l => l.classList.add('hidden'));
    setTimeout(() => { this.container.innerHTML = ''; }, fadeDuration);
  }

  reset() {
    this.entries.forEach(e => e.fired = false);
    this.container.innerHTML = '';
    if (this._typeTimer) { clearInterval(this._typeTimer); this._typeTimer = null; }
  }
}

// ── Effect Timeline ───────────────────────────────────────

function lerpVal(a, b, t) {
  return a + (b - a) * t;
}

/**
 * PostFX + renderer parameter interpolation over time.
 * keyframes: [{ time, fog?, fogColor?, exposure?, noise?, scanlines?, glitch?, colorShift?, pixelSize?, bloom? }]
 */
export class EffectTimeline {
  constructor(postfx, renderer, keyframes) {
    this.postfx = postfx;
    this.renderer = renderer;
    this.keyframes = keyframes.sort((a, b) => a.time - b.time);
  }

  update(elapsed) {
    const kf = this.keyframes;
    if (kf.length === 0) return;

    // Before first keyframe
    if (elapsed <= kf[0].time) {
      this._apply(kf[0]);
      return;
    }

    // After last keyframe
    if (elapsed >= kf[kf.length - 1].time) {
      this._apply(kf[kf.length - 1]);
      return;
    }

    // Find segment and interpolate
    for (let i = 0; i < kf.length - 1; i++) {
      if (elapsed >= kf[i].time && elapsed < kf[i + 1].time) {
        const t = (elapsed - kf[i].time) / (kf[i + 1].time - kf[i].time);
        this._applyInterpolated(kf[i], kf[i + 1], t);
        return;
      }
    }
  }

  _apply(kf) {
    if (kf.exposure != null) this.renderer.setExposure(kf.exposure);
    if (kf.fogNear != null) this.renderer.setFogNear(kf.fogNear);
    if (kf.fogFar != null) this.renderer.setFogFar(kf.fogFar);
    if (kf.noise != null) this.postfx.setNoise(kf.noise);
    if (kf.scanlines != null) this.postfx.setScanlines(kf.scanlines);
    if (kf.glitch != null) this.postfx.setGlitch(kf.glitch);
    if (kf.colorShift != null) this.postfx.setColorShift(kf.colorShift);
    if (kf.pixelSize != null) this.postfx.setPixelSize(kf.pixelSize);
    if (kf.bloom != null) this.postfx.setBloom(kf.bloom);
  }

  _applyInterpolated(a, b, t) {
    const lerp = lerpVal;
    if (a.exposure != null && b.exposure != null) this.renderer.setExposure(lerp(a.exposure, b.exposure, t));
    else if (b.exposure != null) this.renderer.setExposure(b.exposure);
    if (a.fogNear != null && b.fogNear != null) this.renderer.setFogNear(lerp(a.fogNear, b.fogNear, t));
    if (a.fogFar != null && b.fogFar != null) this.renderer.setFogFar(lerp(a.fogFar, b.fogFar, t));
    if (a.noise != null && b.noise != null) this.postfx.setNoise(lerp(a.noise, b.noise, t));
    else if (b.noise != null) this.postfx.setNoise(b.noise);
    if (a.scanlines != null && b.scanlines != null) this.postfx.setScanlines(lerp(a.scanlines, b.scanlines, t));
    else if (b.scanlines != null) this.postfx.setScanlines(b.scanlines);
    if (a.glitch != null && b.glitch != null) this.postfx.setGlitch(lerp(a.glitch, b.glitch, t));
    else if (b.glitch != null) this.postfx.setGlitch(b.glitch);
    if (a.colorShift != null && b.colorShift != null) this.postfx.setColorShift(lerp(a.colorShift, b.colorShift, t));
    else if (b.colorShift != null) this.postfx.setColorShift(b.colorShift);
    if (a.pixelSize != null && b.pixelSize != null) this.postfx.setPixelSize(lerp(a.pixelSize, b.pixelSize, t));
    if (b.bloom != null) this.postfx.setBloom(b.bloom);
  }
}

// ── Event Timeline ────────────────────────────────────────

/**
 * General-purpose timed event list.
 * events: [{ time, fn }]
 */
export class EventTimeline {
  constructor(events) {
    this.events = events.map(e => ({ ...e, fired: false }));
  }

  update(elapsed) {
    for (const ev of this.events) {
      if (!ev.fired && elapsed >= ev.time) {
        ev.fired = true;
        ev.fn();
      }
    }
  }

  reset() {
    this.events.forEach(e => e.fired = false);
  }
}

// ── Run Trailer (main loop) ──────────────────────────────

/**
 * Main animation loop for a trailer.
 * @param {object} config
 *   - renderer, postfx, camera
 *   - cameraPath: CameraPath instance
 *   - textTimeline: TextTimeline instance (optional)
 *   - effectTimeline: EffectTimeline instance (optional)
 *   - eventTimeline: EventTimeline instance (optional)
 *   - duration: total seconds
 *   - onUpdate(elapsed): per-frame callback (optional)
 *   - onEnd(): called when duration reached (optional)
 * @returns {{ stop: Function }} control handle
 */
export function runTrailer(config) {
  const {
    renderer, postfx, camera,
    cameraPath, textTimeline, effectTimeline, eventTimeline,
    duration = 30, onUpdate, onPostRender, onEnd,
  } = config;

  let running = true;
  const startTime = performance.now();

  function frame(ts) {
    if (!running) return;
    const elapsed = (ts - startTime) / 1000;

    if (elapsed >= duration) {
      running = false;
      if (onEnd) onEnd();
      return;
    }

    // Update timelines
    if (cameraPath) cameraPath.update(elapsed, camera);
    if (textTimeline) textTimeline.update(elapsed);
    if (effectTimeline) effectTimeline.update(elapsed);
    if (eventTimeline) eventTimeline.update(elapsed);

    // Custom per-frame logic
    if (onUpdate) onUpdate(elapsed);

    // Update PostFX time uniform
    postfx.update(elapsed);

    // Render
    if (postfx.enabled) {
      postfx.render();
    } else {
      renderer.render();
    }

    // Post-render callback (for recording compositor)
    if (onPostRender) onPostRender(elapsed);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  return {
    stop() { running = false; },
  };
}
