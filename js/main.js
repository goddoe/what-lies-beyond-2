import * as THREE from 'three';
import { Renderer } from './engine/renderer.js';
import { Player } from './engine/player.js';
import { PostFX } from './engine/postfx.js';
import { MapBuilder } from './world/map-builder.js';
import { TriggerManager } from './world/triggers.js';
import { Narrator } from './narrative/narrator.js';
import { DecisionTracker } from './narrative/decision-tracker.js';
import { EndingController } from './narrative/endings.js';
import { getLine, getIdleLine } from './narrative/script-data.js';
import { PLAYER_START } from './world/map-data.js';
import { GameState, State } from './systems/game-state.js';
import { Inventory } from './systems/inventory.js';
import { UI } from './systems/ui.js';
import { PlaythroughMemory } from './systems/playthrough-memory.js';
import { getLanguage, setLanguage } from './data/i18n.js';
import { AudioSystem } from './engine/audio.js';
import { selectVariant } from './world/run-variants.js';
import { CCTVReplay } from './systems/cctv-replay.js';
import { Terminal } from './systems/terminal.js';
import { Era10Ending } from './systems/era10-ending.js';

// ── Bootstrap ──────────────────────────────────────────

const canvas = document.getElementById('game-canvas');
const renderer = new Renderer(canvas);
const player = new Player(renderer.camera, renderer.renderer, renderer.scene);
const postfx = new PostFX(renderer, renderer.scene, renderer.camera);
const mapBuilder = new MapBuilder(renderer.scene);
const triggers = new TriggerManager();
const narrator = new Narrator();
const tracker = new DecisionTracker();
const gameState = new GameState();
const inventory = new Inventory();
const ui = new UI(gameState);
const audio = new AudioSystem();
const memory = new PlaythroughMemory();
const endings = new EndingController(narrator, tracker, postfx, getLanguage(), memory);

// Set initial narrator mode based on era
if (memory.getEra() === 1) {
  narrator.setNarratorMode('inner');
} else {
  narrator.setNarratorMode('dialogue');
}

// ── 6-Stage Awareness System (Era 1) ──────────────────
// Replaces the old 2-step runDefianceCount system.
// Points accumulate from defiance, exploration, environment clues, lore, and time.
// Level 0 (DORMANT) → 1 (SEEDED) → 2 (UNEASY) → 3 (QUESTIONING) → 4 (CRACKING) → 5 (REVEALED)
let awarenessPoints = 0;
let awarenessLevel = 0;
const AWARENESS_THRESHOLDS = [0, 3, 6, 10, 14, 18];
const AWARENESS_MODES = ['inner', 'inner', 'inner', 'inner_uneasy', 'cracking', 'revealed'];
let awarenessSourceLog = []; // for debugging: tracks what contributed points
let lastAwarenessTimeGrant = 0; // elapsed seconds of last time-based grant

endings.setGameState(gameState);

// ── CCTV + Terminal Systems ──────────────────────────────
const cctvReplay = new CCTVReplay(renderer, narrator, memory, getLanguage);
const terminal = new Terminal(memory, getLanguage);
const era10Ending = new Era10Ending(memory, postfx, getLanguage);

// ── Build World ──────────────────────────────────────────

let currentVariant = null;
let valveAnim = null;
const era = memory.getEra();
mapBuilder.setLang(getLanguage());

// Initial variant selection for era 4+
currentVariant = selectVariant(era, memory.lastVariant);
mapBuilder.collectedLore = memory.loreCollected;
const buildResult = mapBuilder.build(era, currentVariant);
player.setColliders(buildResult.colliders);
player.setInteractables(buildResult.interactables);
triggers.loadZones(buildResult.triggerZones);
let activeGhosts = buildResult.ghosts || [];
let doorSystem = buildResult.doorSystem;
player.setupFlashlight(renderer.scene);
mapBuilder.updateShadowsForRoom('START_ROOM');
if (currentVariant) {
  memory.lastVariant = currentVariant.id;
  memory.save();
}

// Era-based atmospheric settings
applyEraAtmosphere(era);

// Apply initial variant effects (era 4+ on fresh load)
if (currentVariant) {
  // Defer to after all functions are defined (needed for hoisting edge cases)
  setTimeout(() => applyVariantEffects(currentVariant), 100);
}

// ── Era Atmosphere ──────────────────────────────────────

function applyEraAtmosphere(eraLevel) {
  // OutputPass handles Linear→sRGB — no brightness compensation needed
  // colorShift: subtle base value — intermittent spikes applied in game loop
  if (eraLevel >= 8) {
    postfx.setNoise(0.04);
    postfx.setScanlines(0.02);
    postfx.setColorShift(0.015);
    postfx.setGlitch(0.01);
    postfx.enabled = true;
  } else if (eraLevel >= 7) {
    postfx.setNoise(0.035);
    postfx.setScanlines(0.016);
    postfx.setColorShift(0.012);
    postfx.enabled = true;
  } else if (eraLevel >= 5) {
    postfx.setNoise(0.03);
    postfx.setScanlines(0.012);
    postfx.setColorShift(0.008);
    postfx.enabled = true;
  } else if (eraLevel >= 4) {
    postfx.setNoise(0.012);
    postfx.setScanlines(0.008);
    postfx.setColorShift(0.005);
    postfx.enabled = true;
  } else if (eraLevel >= 3) {
    postfx.setPixelSize(0.007);
    postfx.enabled = true;
  } else {
    postfx.enabled = false;
  }
}

// ── Wire UI ──────────────────────────────────────────────

ui.onStart = () => {
  gameState.set(State.CLICK_TO_PLAY);
};

ui.onResume = () => {
  gameState.set(State.CLICK_TO_PLAY);
};

ui.onRestart = () => {
  restartGame();
};

ui.onLanguageChange = (lang) => {
  endings.setLang(lang);
  mapBuilder.setLang(lang);
};

ui.onReset = () => {
  const lang = getLanguage();
  const msg = lang === 'ko'
    ? '모든 진행 상황이 삭제됩니다. 정말 초기화할까요?'
    : 'All progress will be erased. Are you sure?';
  if (confirm(msg)) {
    memory.reset();
    location.reload();
  }
};

// Click-to-play: lock pointer
document.getElementById('click-to-play').addEventListener('click', () => {
  if (gameState.is(State.CLICK_TO_PLAY)) {
    player.lock();
  }
});

// Player lock/unlock
player.onLock = () => {
  // Guard: don't override CCTV / terminal state with PLAYING
  if (gameState.is(State.CCTV) || gameState.is(State.TERMINAL)) return;
  gameState.set(State.PLAYING);
  audio.init();
  audio.setAmbiance(AudioSystem.getRoomAmbianceType(gameState.currentRoom));
};

player.onUnlock = () => {
  if (gameState.is(State.PLAYING) && !codeInputActive) {
    gameState.set(State.PAUSED);
    updateEndingTracker();
    updateLoreTracker();
  }
};

// ── Ending Tracker (Pause Menu) ──────────────────────────

const ALL_ENDINGS = [
  { id: 'false_happy', ko: '거짓 행복', en: 'False Happy' },
  { id: 'truth',       ko: '진실',     en: 'Truth' },
  { id: 'rebellion',   ko: '반란',     en: 'Rebellion' },
  { id: 'loop',        ko: '루프',     en: 'Loop' },
  { id: 'meta',        ko: '메타',     en: 'Meta' },
  { id: 'compassion',  ko: '공감',     en: 'Compassion' },
  { id: 'silence',     ko: '침묵',     en: 'Silence' },
  { id: 'awakening',   ko: '각성',     en: 'Awakening' },
  { id: 'partnership', ko: '동행',     en: 'Partnership' },
  { id: 'bargain',     ko: '거래',     en: 'Bargain' },
  { id: 'escape',      ko: '탈출',     en: 'Escape' },
  { id: 'overwrite',   ko: '덮어쓰기', en: 'Overwrite' },
  { id: 'memory_ending', ko: '기억',   en: 'Memory' },
  { id: 'fourth_wall', ko: '제4의 벽', en: 'Fourth Wall' },
  { id: 'acceptance',  ko: '수용',     en: 'Acceptance' },
];

function updateEndingTracker() {
  const container = document.getElementById('ending-tracker');
  if (!container) return;
  const lang = getLanguage();
  const seen = memory.endingsSeen;
  container.innerHTML = ALL_ENDINGS.map(e => {
    const unlocked = seen.has(e.id);
    const label = unlocked ? (lang === 'ko' ? e.ko : e.en) : '???';
    return `<span class="ending-chip ${unlocked ? 'unlocked' : 'locked'}">${label}</span>`;
  }).join('');
}

function updateLoreTracker() {
  const container = document.getElementById('lore-tracker');
  if (!container) return;
  const lang = getLanguage();
  const count = memory.loreCollected.size;
  if (count === 0) {
    container.textContent = '';
    return;
  }
  const complete = count >= 8;
  container.className = 'lore-tracker' + (complete ? ' lore-complete' : '');
  container.textContent = complete
    ? (lang === 'ko' ? `◆ 로어 수집 완료 (${count}/8) ◆` : `◆ Lore Complete (${count}/8) ◆`)
    : (lang === 'ko' ? `로어 ${count}/8` : `Lore ${count}/8`);
}

// Ending restart
endings.onRestart = () => {
  restartGame();
};

// ── Narrative Helpers ──────────────────────────────────

function narratorLine(scriptId, options = {}) {
  const lang = getLanguage();
  const line = getLine(scriptId, tracker, lang, gameState, memory, awarenessLevel);
  if (!line) return;

  narrator.say(line.text, {
    mood: line.mood,
    id: line.id,
    delay: line.delay || options.delay || 0,
  });

  // Handle follow-ups (up to 3 levels deep)
  if (line.followUp) {
    const f1 = getLine(line.followUp, tracker, lang, gameState, memory, awarenessLevel);
    if (f1) {
      narrator.say(f1.text, { mood: f1.mood, id: f1.id, delay: f1.delay || 2000 });
      if (f1.followUp) {
        const f2 = getLine(f1.followUp, tracker, lang, gameState, memory, awarenessLevel);
        if (f2) {
          narrator.say(f2.text, { mood: f2.mood, id: f2.id, delay: f2.delay || 2000 });
        }
      }
    }
  }
}

/**
 * Add awareness points and check for level advancement.
 * Only active in Era 1; Era 2+ uses dialogue mode throughout.
 * @param {number} points - Points to add
 * @param {string} source - Category: 'defiance', 'exploration', 'environment', 'lore', 'time'
 */
function addAwareness(points, source) {
  if (memory.getEra() > 1) return;
  if (awarenessLevel >= 5) return; // already fully revealed

  awarenessPoints += points;
  awarenessSourceLog.push({ source, points, total: awarenessPoints });

  // Era 1: cap at level 2 (UNEASY) — Observer AI stays disguised throughout.
  // AI may slip (know too much) but never breaks character or self-suspects.
  // Full reveal happens in Era 2+ when narrator switches to dialogue mode.
  const cap = 2;
  for (let lvl = awarenessLevel + 1; lvl <= cap; lvl++) {
    if (awarenessPoints >= AWARENESS_THRESHOLDS[lvl]) {
      advanceAwareness(lvl, source);
    }
  }
}

/**
 * Advance awareness to a new level. Triggers transition dialogue and mode switch.
 * @param {number} newLevel - Target level (1-5)
 * @param {string} source - What triggered the advance
 */
function advanceAwareness(newLevel, source) {
  if (newLevel <= awarenessLevel) return;
  awarenessLevel = newLevel;

  const mode = AWARENESS_MODES[newLevel];
  narrator.setNarratorMode(mode);

  // Transition dialogue for each level
  if (newLevel === 1) {
    narratorLine('awareness_seeded');
  } else if (newLevel === 2) {
    narratorLine('awareness_uneasy');
  } else if (newLevel === 3) {
    narratorLine('awareness_questioning');
  } else if (newLevel === 4) {
    narratorLine('awareness_cracking');
  } else if (newLevel === 5) {
    memory.markNarratorRevealed();
    narratorLine('narrator_revealed');
    // After reveal, switch to dialogue mode after a beat
    setTimeout(() => {
      narrator.setNarratorMode('dialogue');
    }, 8000);
  }
}

/**
 * Force awareness to level 5 (for ending rooms).
 */
function forceFullReveal() {
  // Era 1: Observer AI stays disguised — no reveal even at ending rooms
  if (memory.getEra() === 1) return;
  if (memory.getEra() > 1) return; // Era 2+: already in dialogue mode from start
  if (awarenessLevel >= 5) return;
  awarenessPoints = AWARENESS_THRESHOLDS[5];
  advanceAwareness(5, 'forced');
}

// Show inventory popup notification
function showInventoryPopup(textKo, textEn) {
  const lang = getLanguage();
  const popup = document.createElement('div');
  popup.className = 'inventory-popup';
  popup.textContent = lang === 'ko' ? textKo : textEn;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 3200);
}

// ── Interaction System ──────────────────────────────────

const interactPrompt = document.getElementById('interact-prompt');
let interactCooldown = 0;

// Wall bump reactions
let wallBumpIndex = 0;
const wallBumpLines = ['wall_bump_1', 'wall_bump_2', 'wall_bump_3'];
player.onWallBump = () => {
  if (!gameState.is(State.PLAYING)) return;
  narratorLine(wallBumpLines[wallBumpIndex % wallBumpLines.length]);
  wallBumpIndex++;
};

// ── Code Input (Security Checkpoint Puzzle) ──────────────

const codeOverlay = document.getElementById('code-input-overlay');
const codeField = document.getElementById('code-input-field');
let codeInputActive = false;

function openCodeInput() {
  if (codeInputActive) return;
  codeInputActive = true;
  codeOverlay.style.display = 'flex';
  player.controls.unlock();
  // Delay focus so the E keypress doesn't enter 'ㄷ' into the field
  setTimeout(() => {
    codeField.value = '';
    codeField.focus();
  }, 50);
}

function closeCodeInput() {
  codeOverlay.style.display = 'none';
  // Keep codeInputActive true briefly so ESC-triggered unlock doesn't show pause menu
  setTimeout(() => {
    codeInputActive = false;
    player.lock();
  }, 150);
}

if (codeField) {
  codeField.addEventListener('keydown', (e) => {
    e.stopPropagation(); // Prevent game keys (Space skip, F flashlight, E interact) from firing
    if (e.code === 'Escape') {
      e.preventDefault();
      closeCodeInput();
      return;
    }
    if (e.code === 'Enter') {
      e.preventDefault();
      const code = codeField.value.trim();
      if (code === '7491') {
        closeCodeInput();
        narratorLine('security_code_correct');
        tracker.completePuzzle('security_code');
        // Unlock holding cells door
        mapBuilder.unlockDoor('SECURITY_CHECKPOINT', 'north', player.colliders);
        showInventoryPopup('보안 코드 승인', 'Security Code Accepted');
      } else {
        narratorLine('security_code_wrong');
        codeField.value = '';
      }
    }
  });
}

// ── E Key Interaction ──────────────────────────────────

document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyE' && gameState.is(State.PLAYING) && interactCooldown <= 0) {
    const target = player.checkInteraction();
    if (!target) return;

    // Door interaction (shorter cooldown)
    if (target.type === 'door' && target.door) {
      interactCooldown = 1;
      // Remove collider from player's list before opening
      const doorCollider = target.door.colliderMesh;
      if (doorCollider) {
        const ci = player.colliders.indexOf(doorCollider);
        if (ci >= 0) player.colliders.splice(ci, 1);
      }
      // Remove interact mesh from player's interactables list
      const ii = player.interactables.indexOf(target);
      if (ii >= 0) player.interactables.splice(ii, 1);
      doorSystem.openDoor(target.door);
      audio.playDoorOpen();
      return;
    }

    interactCooldown = 3;

    // Special prop interactions
    if (target.propId === 'flashlight_drawer') {
      if (!inventory.has('flashlight')) {
        inventory.add('flashlight');
        if (target.mesh) target.mesh.visible = false;
        // Remove from interactables so E prompt stops showing
        const idx = player.interactables.indexOf(target);
        if (idx >= 0) player.interactables.splice(idx, 1);
        narratorLine('flashlight_pickup');
        showInventoryPopup('손전등 획득', 'Flashlight Acquired');
      }
      return;
    }

    if (target.propId === 'keycard') {
      if (!inventory.has('keycard')) {
        inventory.add('keycard');
        if (target.mesh) target.mesh.visible = false;
        // Remove from interactables so E prompt stops showing
        const idx = player.interactables.indexOf(target);
        if (idx >= 0) player.interactables.splice(idx, 1);
        narratorLine('keycard_pickup');
        showInventoryPopup('키카드 획득', 'Keycard Acquired');
      }
      return;
    }

    if (target.propId === 'cooling_console') {
      if (!tracker.puzzlesCompleted.has('cooling_fix')) {
        // Start valve wheel rotation animation
        const wheel = target.mesh.getObjectByName('valve_wheel');
        if (wheel) valveAnim = { wheel, elapsed: 0, duration: 2.5 };
        tracker.completePuzzle('cooling_fix');
        narratorLine('cooling_restored');
        showInventoryPopup('냉각 시스템 복구', 'Cooling System Restored');
      }
      return;
    }

    if (target.propId === 'security_terminal') {
      if (!tracker.puzzlesCompleted.has('security_code')) {
        openCodeInput();
      }
      return;
    }

    if (target.propId === 'garden_terminal') {
      if (inventory.has('keycard') && !tracker.puzzlesCompleted.has('keycard_used')) {
        narratorLine('keycard_use');
        tracker.completePuzzle('keycard_used');
        // Unlock the keycard door — makes it interactable (E key to open), stays closed
        mapBuilder.unlockDoor('GARDEN_ANTECHAMBER', 'north', player.colliders);
        // Add the new door interactable to player's list
        const newDoorInteractable = mapBuilder.interactables[mapBuilder.interactables.length - 1];
        if (newDoorInteractable && newDoorInteractable.type === 'door') {
          player.interactables.push(newDoorInteractable);
        }
        showInventoryPopup('정원 문 해제됨 — E키로 열기', 'Garden Door Unlocked — Press E to open');
      } else if (!inventory.has('keycard')) {
        narratorLine('garden_ante_terminal');
      }
      return;
    }

    if (target.propId === 'overwrite_terminal') {
      if (memory.getEra() >= 5) {
        narratorLine('overwrite_terminal');
        setTimeout(() => {
          narratorLine('overwrite_confirm');
          setTimeout(() => {
            triggerEnding('overwrite');
          }, 5000);
        }, 3000);
      }
      return;
    }

    // Lore document interactions
    if (target.type === 'document' && target.propId && target.propId.startsWith('lore_')) {
      const loreId = target.propId;
      if (!memory.loreCollected.has(loreId)) {
        memory.collectLore(loreId);
        tracker.findLore(loreId);
        addAwareness(2, 'lore');
        narratorLine(loreId);
        // Remove mesh from scene and interactables
        if (target.mesh) {
          target.mesh.visible = false;
          if (target.mesh.parent) target.mesh.parent.remove(target.mesh);
        }
        const ii = player.interactables.indexOf(target);
        if (ii >= 0) player.interactables.splice(ii, 1);
        showInventoryPopup(`로어 발견 (${memory.loreCollected.size}/8)`, `Lore Found (${memory.loreCollected.size}/8)`);
      }
      return;
    }

    // Era 8-9: CCTV monitor interaction
    if (target.propId === 'cctv_monitor' && memory.getEra() >= 8) {
      narratorLine('cctv_monitor_interact');
      return;
    }

    // Prop-specific interaction (e.g. per-monitor in OFFICE_WING after lore completion)
    const lang = getLanguage();
    if (target.propId && memory.allLoreCollected) {
      const propScript = `interact_${target.propId}`;
      const propLine = getLine(propScript, tracker, lang, gameState, memory, awarenessLevel);
      if (propLine) {
        narratorLine(propScript);
        return;
      }
    }

    // Room-specific or type-based interaction
    const roomScript = `interact_${target.room}`;
    const typeMap = {
      'monitor': 'interact_monitor_default',
      'console': 'interact_console_default',
      'monitor_wall': 'interact_monitor_wall',
    };

    const roomLine = getLine(roomScript, tracker, lang, gameState, memory, awarenessLevel);
    if (roomLine) {
      narratorLine(roomScript);
    } else {
      narratorLine(typeMap[target.type] || 'interact_monitor_default');
    }
  }
});

// ── Trigger Handlers ──────────────────────────────────

// Disable loop_back initially
triggers.setActive('loop_back', false);

// ═════════════ START ROOM ═════════════

triggers.on('start_wake', () => {
  // Variant-specific wake lines
  if (currentVariant && currentVariant.id === 'SEALED_LEFT') {
    narratorLine('variant_sealed_left_wake');
  } else if (currentVariant && currentVariant.id === 'SEALED_RIGHT') {
    narratorLine('variant_sealed_right_wake');
  } else if (currentVariant && currentVariant.id === 'MIRROR') {
    narratorLine('variant_mirror_wake');
  } else {
    narratorLine('start_wake');
  }
});

// ═════════════ HALLWAY ═════════════

triggers.on('hallway_enter', () => {
  narratorLine('hallway_enter');
});

triggers.on('hallway_midpoint', () => {
  narratorLine('hallway_midpoint');
});

triggers.on('decision_point', () => {
  if (!gameState.hasDecision('hallway_choice')) {
    // Variant-specific decision lines
    if (currentVariant && currentVariant.id === 'SEALED_LEFT') {
      narratorLine('variant_sealed_left_decision');
    } else if (currentVariant && currentVariant.id === 'SEALED_RIGHT') {
      narratorLine('variant_sealed_right_decision');
    } else {
      narratorLine('decision_point');
    }
    triggers.setActive('loop_back', true);
    triggers.resetTrigger('loop_back');
  }
});

// ═════════════ COMPLIANCE CORRIDORS ═════════════

triggers.on('corridor_comp1_enter', () => {
  narratorLine('corridor_comp1_enter');
});
triggers.on('corridor_comp1_mid', () => {
  narratorLine('corridor_comp1_mid');
});

triggers.on('corridor_comp2_enter', () => {
  narratorLine('corridor_comp2_enter');
});
triggers.on('corridor_comp2_mid', () => {
  narratorLine('corridor_comp2_mid');
});

triggers.on('corridor_comp3_enter', () => {
  narratorLine('corridor_comp3_enter');
});
triggers.on('corridor_comp3_mid', () => {
  narratorLine('corridor_comp3_mid');
});

triggers.on('corridor_comp4_enter', () => {
  narratorLine('corridor_comp4_enter');
});
triggers.on('corridor_comp4_mid', () => {
  narratorLine('corridor_comp4_mid');
});

// ═════════════ DEFIANCE CORRIDORS ═════════════

triggers.on('corridor_def1_enter', () => {
  narratorLine('corridor_def1_enter');
});
triggers.on('corridor_def1_mid', () => {
  narratorLine('corridor_def1_mid');
});

triggers.on('corridor_def2_enter', () => {
  narratorLine('corridor_def2_enter');
});
triggers.on('corridor_def2_mid', () => {
  narratorLine('corridor_def2_mid');
});

triggers.on('corridor_def3_enter', () => {
  narratorLine('corridor_def3_enter');
});
triggers.on('corridor_def3_mid', () => {
  narratorLine('corridor_def3_mid');
});

triggers.on('corridor_def4_enter', () => {
  narratorLine('corridor_def4_enter');
});
triggers.on('corridor_def4_mid', () => {
  narratorLine('corridor_def4_mid');
});

// ═════════════ COMPLIANCE PATH ═════════════

// OFFICE WING (left choice)
triggers.on('office_enter', () => {
  if (!gameState.hasDecision('hallway_choice')) {
    gameState.markDecision('hallway_choice');
    tracker.record('왼쪽으로 가세요 / Go left', '왼쪽 / Left', true);
    narratorLine('chose_left');
    narratorLine('office_enter', { delay: 2000 });
  } else {
    narratorLine('office_enter');
  }
  gameState.enterRoom('OFFICE_WING');
});

triggers.on('office_deep', () => {
  narratorLine('office_deep');
});

// BREAK ROOM (optional, decision C1)
triggers.on('break_room_enter', () => {
  if (!gameState.hasDecision('decision_c1')) {
    gameState.markDecision('decision_c1');
    tracker.record('서쪽으로 가세요 / Go west', '아래(휴게실) / Down (break room)', false);
    tracker.exploreOptional('BREAK_ROOM');
    addAwareness(1, 'exploration');
  }
  narratorLine('break_room_enter');
  gameState.enterRoom('BREAK_ROOM');
});

// CONFERENCE
triggers.on('conference_enter', () => {
  narratorLine('conference_enter');
  gameState.enterRoom('CONFERENCE');
});

triggers.on('conference_west', () => {
  narratorLine('conference_west');
  if (!gameState.hasDecision('conference_curiosity')) {
    gameState.markDecision('conference_curiosity');
  }
});

// OBSERVATION DECK (new, optional, decision C2 variant)
triggers.on('observation_enter', () => {
  if (!gameState.hasDecision('decision_c2_south')) {
    gameState.markDecision('decision_c2_south');
    tracker.record('북쪽으로 가세요 / Go north', '남쪽(관측실) / South (observation)', false);
    tracker.exploreOptional('OBSERVATION_DECK');
    addAwareness(1, 'exploration');
  }
  narratorLine('observation_enter');
  gameState.enterRoom('OBSERVATION_DECK');
});

triggers.on('observation_window', () => {
  narratorLine('observation_window');
});

triggers.on('observation_deep', () => {
  narratorLine('observation_deep');
});

// ARCHIVE (secret path)
triggers.on('archive_enter', () => {
  if (!gameState.hasDecision('archive_entered')) {
    gameState.markDecision('archive_entered');
    tracker.record('북쪽으로 가세요 / Go north', '서쪽(자료실) / West (archive)', false);
    tracker.exploreOptional('ARCHIVE');
    addAwareness(1, 'exploration');
  }
  narratorLine('archive_enter');
  gameState.enterRoom('ARCHIVE');
});

triggers.on('archive_deep', () => {
  narratorLine('archive_deep');
});

triggers.on('archive_secret', () => {
  addAwareness(3, 'lore');
  narratorLine('archive_secret');
});

// FORGOTTEN WING (new, optional)
triggers.on('forgotten_enter', () => {
  tracker.exploreOptional('FORGOTTEN_WING');
  addAwareness(1, 'exploration');
  narratorLine('forgotten_enter');
  gameState.enterRoom('FORGOTTEN_WING');
});

triggers.on('forgotten_explore', () => {
  narratorLine('forgotten_explore');
});

triggers.on('forgotten_terminal', () => {
  narratorLine('forgotten_terminal');
});

// EXPERIMENT LAB (meta ending path)
triggers.on('lab_enter', () => {
  narratorLine('lab_enter');
  gameState.enterRoom('EXPERIMENT_LAB');
});

triggers.on('lab_discovery', () => {
  narratorLine('lab_discovery');
});

triggers.on('meta_ending', () => {
  triggerEnding('meta');
});

// RECORDS ROOM (new, optional, decision C3)
triggers.on('records_enter', () => {
  if (!gameState.hasDecision('decision_c3')) {
    gameState.markDecision('decision_c3');
    tracker.record('북쪽으로 가세요 / Go north', '동쪽(기록실) / East (records)', false);
    tracker.exploreOptional('RECORDS_ROOM');
    addAwareness(1, 'exploration');
  }
  narratorLine('records_enter');
  gameState.enterRoom('RECORDS_ROOM');
});

triggers.on('records_browse', () => {
  narratorLine('records_browse');
});

triggers.on('records_discovery', () => {
  narratorLine('records_discovery');
});

// UPPER OFFICE
triggers.on('upper_office_enter', () => {
  narratorLine('upper_office_enter');
  gameState.enterRoom('UPPER_OFFICE');
});

triggers.on('upper_office_desk', () => {
  narratorLine('upper_office_desk');
});

// DIRECTOR SUITE (new, optional, decision C4)
triggers.on('director_enter', () => {
  if (!gameState.hasDecision('decision_c4')) {
    gameState.markDecision('decision_c4');
    tracker.record('북쪽으로 가세요 / Go north', '동쪽(디렉터실) / East (director)', false);
    tracker.exploreOptional('DIRECTOR_SUITE');
    addAwareness(1, 'exploration');
  }
  narratorLine('director_enter');
  gameState.enterRoom('DIRECTOR_SUITE');
});

triggers.on('director_desk', () => {
  narratorLine('director_desk');
});

triggers.on('director_keycard', () => {
  narratorLine('director_keycard');
});

// GARDEN ANTECHAMBER (new, compliance path)
triggers.on('garden_ante_enter', () => {
  narratorLine('garden_ante_enter');
  gameState.enterRoom('GARDEN_ANTECHAMBER');
});

triggers.on('garden_ante_deep', () => {
  narratorLine('garden_ante_deep');
});

// FALSE ENDING
triggers.on('false_ending_enter', () => {
  forceFullReveal();
  narratorLine('false_ending_enter');
  gameState.enterRoom('FALSE_ENDING_ROOM');
});

triggers.on('false_ending', () => {
  triggerEnding('false_happy');
});

// ═════════════ DEFIANCE PATH ═════════════

// MAINTENANCE (right choice)
triggers.on('maintenance_enter', () => {
  if (!gameState.hasDecision('hallway_choice')) {
    gameState.markDecision('hallway_choice');
    tracker.record('왼쪽으로 가세요 / Go left', '오른쪽 / Right', false);
    addAwareness(2, 'defiance');
    narratorLine('chose_right');
    narratorLine('maintenance_enter', { delay: 2000 });
  } else {
    narratorLine('maintenance_enter');
  }
  gameState.enterRoom('MAINTENANCE');

  // Check rebellion ending
  if (tracker.defianceStreak >= 3) {
    triggerEnding('rebellion');
  }
});

triggers.on('maintenance_deep', () => {
  narratorLine('maintenance_deep');
});

// VENTILATION SHAFT (new, optional, decision D1)
triggers.on('vent_enter', () => {
  if (!gameState.hasDecision('decision_d1')) {
    gameState.markDecision('decision_d1');
    tracker.record('환기구에 들어가지 마세요 / Don\'t enter the shaft', '환기구 진입 / Entered shaft', false);
    tracker.exploreOptional('VENTILATION_SHAFT');
    addAwareness(1, 'exploration');
  }
  narratorLine('vent_enter');
  gameState.enterRoom('VENTILATION_SHAFT');
});

triggers.on('vent_message', () => {
  narratorLine('vent_message');
});

triggers.on('vent_deep', () => {
  narratorLine('vent_deep');
});

// SECURITY CHECKPOINT
triggers.on('security_enter', () => {
  addAwareness(2, 'environment');
  narratorLine('security_enter');
  gameState.enterRoom('SECURITY_CHECKPOINT');
});

triggers.on('security_check', () => {
  narratorLine('security_check');
});

// HOLDING CELLS (new, needs security code 7491)
triggers.on('holding_enter', () => {
  tracker.exploreOptional('HOLDING_CELLS');
  addAwareness(1, 'exploration');
  narratorLine('holding_enter');
  gameState.enterRoom('HOLDING_CELLS');
});

triggers.on('holding_cells_inspect', () => {
  narratorLine('holding_cells_inspect');
});

triggers.on('holding_revelation', () => {
  narratorLine('holding_revelation');
});

// SERVER ROOM
triggers.on('server_enter', () => {
  narratorLine('server_enter');
  gameState.enterRoom('SERVER_ROOM');
});

triggers.on('server_deep', () => {
  narratorLine('server_deep');
});

// COOLING ROOM (new, optional, decision D2)
triggers.on('cooling_enter', () => {
  tracker.exploreOptional('COOLING_ROOM');
  addAwareness(1, 'exploration');
  narratorLine('cooling_enter');
  gameState.enterRoom('COOLING_ROOM');
});

triggers.on('cooling_deep', () => {
  // Narrate based on whether fixed or not
  if (tracker.puzzlesCompleted.has('cooling_fix')) {
    narratorLine('cooling_fixed');
  } else {
    narratorLine('cooling_warning');
  }
});

// GENERATOR
triggers.on('generator_enter', () => {
  narratorLine('generator_enter');
  gameState.enterRoom('GENERATOR');
});

triggers.on('generator_core', () => {
  narratorLine('generator_core');
});

// REACTOR CORE (new, optional)
triggers.on('reactor_enter', () => {
  tracker.exploreOptional('REACTOR_CORE');
  addAwareness(1, 'exploration');
  narratorLine('reactor_enter');
  gameState.enterRoom('REACTOR_CORE');
});

triggers.on('reactor_core_inspect', () => {
  narratorLine('reactor_inspect');
});

// DATA CENTER
triggers.on('data_center_enter', () => {
  narratorLine('data_center_enter');
  gameState.enterRoom('DATA_CENTER');
});

triggers.on('data_center_screens', () => {
  narratorLine('data_center_screens');
});

// MONITORING STATION (new, optional, decision D3)
triggers.on('monitoring_enter', () => {
  if (!gameState.hasDecision('decision_d3')) {
    gameState.markDecision('decision_d3');
    tracker.record('서쪽 문은 가지 마세요 / Don\'t go west', '서쪽(모니터링) / West (monitoring)', false);
    tracker.exploreOptional('MONITORING_STATION');
    addAwareness(3, 'environment');
  }
  narratorLine('monitoring_enter');
  gameState.enterRoom('MONITORING_STATION');
});

triggers.on('monitoring_screens', () => {
  narratorLine('monitoring_screens');
});

// DEEP STORAGE
triggers.on('deep_storage_enter', () => {
  narratorLine('deep_storage_enter');
  gameState.enterRoom('DEEP_STORAGE');
});

triggers.on('deep_storage_records', () => {
  addAwareness(2, 'lore');
  narratorLine('deep_storage_records');
});

// SUBJECT_CHAMBER (era 5+)
triggers.on('subject_chamber_enter', () => {
  narratorLine('subject_chamber_enter');
  gameState.enterRoom('SUBJECT_CHAMBER');
});

triggers.on('subject_chamber_inspect', () => {
  narratorLine('subject_chamber_inspect');
});

// CONTROL ROOM
triggers.on('control_room_enter', () => {
  forceFullReveal();
  narratorLine('control_room_enter');
  gameState.enterRoom('CONTROL_ROOM');
});

triggers.on('control_room_approach', () => {
  narratorLine('control_room_approach');
});

// TRUTH ENDING
triggers.on('truth_ending', () => {
  triggerEnding('truth');
});

// ═════════════ LOOP PATH ═════════════

triggers.on('loop_back', () => {
  gameState.loopCount++;

  if (gameState.loopCount >= 3) {
    triggerEnding('loop');
  } else if (gameState.loopCount === 1) {
    narratorLine('loop_enter');
    setTimeout(() => {
      player.camera.position.set(0, 1.6, -10);
      player.camera.rotation.set(0, 0, 0); // face north (-Z)
      triggers.resetTrigger('loop_back');
      triggers.resetTrigger('hallway_enter');
      triggers.resetTrigger('hallway_midpoint');
      triggers.resetTrigger('decision_point');
      triggers.resetTrigger('maintenance_enter');
      triggers.resetTrigger('office_enter');
      // Also reset corridor triggers for re-traversal
      triggers.resetTrigger('corridor_comp1_enter');
      triggers.resetTrigger('corridor_def1_enter');
      gameState.clearDecision('hallway_choice');
    }, 500);
  } else {
    narratorLine('loop_second');
    setTimeout(() => {
      player.camera.position.set(0, 1.6, -10);
      player.camera.rotation.set(0, 0, 0); // face north (-Z)
      triggers.resetTrigger('loop_back');
      triggers.resetTrigger('hallway_enter');
      triggers.resetTrigger('hallway_midpoint');
      triggers.resetTrigger('decision_point');
      triggers.resetTrigger('maintenance_enter');
      triggers.resetTrigger('office_enter');
      triggers.resetTrigger('corridor_comp1_enter');
      triggers.resetTrigger('corridor_def1_enter');
      gameState.clearDecision('hallway_choice');
    }, 500);
  }
});

// ── Idle System ──────────────────────────────────────────

let idleCount = 0;
narrator.onIdle(() => {
  if (!gameState.is(State.PLAYING)) return;
  const lang = getLanguage();
  const line = getIdleLine(idleCount, lang);
  narrator.say(line.text, { mood: line.mood, id: line.id });
  idleCount++;
}, 15000);

// ── Ending ──────────────────────────────────────────────

let currentEndingType = null;

// Ghost fadeout helper
function fadeOutGhost(ghost) {
  ghost.userData.faded = true;
  const startTime = performance.now();
  const duration = 3000;
  const materials = [];
  ghost.traverse(child => {
    if (child.material) materials.push(child.material);
  });
  function animateFade() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const opacity = 0.35 * (1 - t);
    for (const mat of materials) {
      mat.opacity = opacity;
    }
    if (t < 1) {
      requestAnimationFrame(animateFade);
    } else {
      ghost.visible = false;
    }
  }
  animateFade();
}

function triggerEnding(type) {
  if (gameState.is(State.ENDING)) return;
  gameState.set(State.ENDING);
  currentEndingType = type;

  // Mark hybrid era completion flags
  const currentEra = memory.getEra();
  if (currentEra === 7 && !memory.hybrid1Completed) {
    memory.hybrid1Completed = true;
    memory.save();
  }
  if (currentEra === 8 && !memory.hybrid2Completed) {
    memory.hybrid2Completed = true;
    memory.save();
  }

  player.controls.unlock();
  endings.trigger(type);
}

// Check compassion ending: cooling puzzle completed
function checkCompassionEnding() {
  return tracker.puzzlesCompleted.has('cooling_fix');
}

// Check partnership ending: era 3+ and all puzzles
function checkPartnershipEnding() {
  const era = memory.getEra();
  if (era < 3) return false;
  return tracker.puzzlesCompleted.size >= 3;
}

// Check memory ending: enough endings seen
function checkMemoryEnding() {
  return memory.endingsSeen.size >= 12;
}

// Check awakening ending: era 3+, in experiment lab
function checkAwakeningEnding() {
  return memory.getEra() >= 3 && gameState.visitedRooms.has('EXPERIMENT_LAB');
}

// Check bargain ending: era 4+, fewer than 3 puzzles
function checkBargainEnding() {
  const era = memory.getEra();
  if (era < 4) return false;
  return tracker.puzzlesCompleted.size < 3;
}

// Check escape ending: era 5+, all 3 puzzles completed
function checkEscapeEnding() {
  const era = memory.getEra();
  if (era < 5) return false;
  return tracker.puzzlesCompleted.has('security_code') &&
         tracker.puzzlesCompleted.has('cooling_fix') &&
         tracker.puzzlesCompleted.has('keycard_used');
}

// Fourth wall: tracked via extended idle (no mouse AND no keyboard) — handled in game loop
let fourthWallTimer = 0;

// Acceptance ending: 60 seconds standing still in CONTROL_ROOM (era 5+)
let acceptanceTimer = 0;
let acceptanceTriggered = false;

// ── Restart ──────────────────────────────────────────────

function restartGame() {
  // Record this playthrough in memory before resetting
  if (currentEndingType) {
    const playTime = gameState.getPlayTime();
    memory.recordEnding(currentEndingType, playTime, tracker.totalDefiance, tracker.totalCompliance);
  }
  currentEndingType = null;

  // Clean up variant-specific timers
  clearVariantTimers();

  // Clean up CCTV/terminal if active
  cctvReplay.stop();
  terminal.hide();
  era10Ending.stop();

  gameState.reset();
  tracker.reset();
  narrator.reset();
  triggers.resetAll();
  triggers.setActive('loop_back', false);
  endings.hide();
  inventory.reset();
  player.resetFlashlight();
  idleCount = 0;
  wallBumpIndex = 0;
  awarenessPoints = 0;
  awarenessLevel = 0;
  awarenessSourceLog = [];
  lastAwarenessTimeGrant = 0;
  fourthWallTimer = 0;
  acceptanceTimer = 0;
  acceptanceTriggered = false;
  valveAnim = null;

  // Set narrator mode based on era for next playthrough
  const newEra = memory.getEra();
  if (newEra === 1) {
    narrator.setNarratorMode('inner');
  } else {
    narrator.setNarratorMode('dialogue');
  }

  // Reset player position
  const [px, py, pz] = PLAYER_START.position;
  player.camera.position.set(px, py, pz);
  player.camera.rotation.set(0, 0, 0);

  // Reset post-fx — disabled by default for performance
  postfx.setGlitch(0);
  postfx.setNoise(0);
  postfx.setScanlines(0);
  postfx.setPixelSize(0);
  postfx.setColorShift(0);
  postfx.setBloom(false);
  postfx.setBrightness(1.0);
  postfx.enabled = false;
  renderer.setExposure(2.4);
  renderer.setFogColor(0x1a1a25);
  renderer.setFogNear(12);
  renderer.setFogFar(60);

  // Rebuild map with new variant
  mapBuilder.clear();
  currentVariant = selectVariant(newEra, memory.lastVariant);
  if (currentVariant) {
    memory.lastVariant = currentVariant.id;
    memory.save();
  }
  mapBuilder.collectedLore = memory.loreCollected;
  const result = mapBuilder.build(newEra, currentVariant);
  player.setColliders(result.colliders);
  player.setInteractables(result.interactables);
  triggers.setZones(result.triggerZones);
  triggers.setActive('loop_back', false);
  activeGhosts = result.ghosts || [];
  doorSystem = result.doorSystem;

  // Apply era-based atmosphere for the new era (may have advanced after ending)
  applyEraAtmosphere(newEra);

  // Apply variant-specific effects
  if (currentVariant) {
    applyVariantEffects(currentVariant);
  }

  // Reset code input state directly — don't use closeCodeInput() which
  // schedules a delayed player.lock() that can interfere with CCTV/terminal modes
  codeOverlay.style.display = 'none';
  codeInputActive = false;

  // Remove variant HUD if exists
  const oldHud = document.getElementById('variant-hud');
  if (oldHud) oldHud.remove();

  // Era routing: special modes for era 6 (CCTV) and era 9 (terminal)
  if (routeByEra(newEra)) {
    console.log(`Restart: era=${newEra} → special mode`);
    return;
  }

  // Skip title — go straight to playing (auto-lock pointer if possible)
  gameState.set(State.CLICK_TO_PLAY);
  ui.init();
  ui.showResetButton(newEra >= 2);
  player.lock();

  console.log(`Restart: era=${newEra}, variant=${currentVariant ? currentVariant.id : 'none'}`);
}

// ── Variant System ──────────────────────────────────────────

let variantTimers = [];
let shooterState = null;

function clearVariantTimers() {
  for (const t of variantTimers) clearTimeout(t);
  variantTimers = [];
  if (shooterState && shooterState._onShoot) {
    document.removeEventListener('click', shooterState._onShoot);
  }
  shooterState = null;
}

function applyVariantEffects(variant) {
  if (!variant || !variant.special) return;

  switch (variant.special) {
    case 'locked_start':
      startLockedStartSequence();
      break;
    case 'short_circuit':
      // Narrator line on start
      variantTimers.push(setTimeout(() => {
        narratorLine('variant_short_circuit_wake');
      }, 2000));
      break;
    case 'dark_run':
      renderer.setExposure(0.3);
      renderer.setFogNear(2);
      renderer.setFogFar(15);
      variantTimers.push(setTimeout(() => {
        narratorLine('variant_dark_run_wake');
      }, 2000));
      break;
    case 'decayed_map':
      variantTimers.push(setTimeout(() => {
        narratorLine('variant_decayed_map_wake');
      }, 2000));
      break;
    case 'empty_world':
      startEmptyWorldSequence();
      break;
    case 'shooter_parody':
      startShooterParody();
      break;
    case 'one_room':
      startOneRoomSequence();
      break;
    case 'cctv_monitors':
      startCCTVMonitorVariant();
      break;
    case 'fragmented':
      startFragmentedVariant();
      break;
  }
}

// ── LOCKED_START variant ──────────────────────────────

function startLockedStartSequence() {
  variantTimers.push(setTimeout(() => {
    narratorLine('variant_locked_start_1');
  }, 10000));
  variantTimers.push(setTimeout(() => {
    narratorLine('variant_locked_start_2');
  }, 20000));
  variantTimers.push(setTimeout(() => {
    narratorLine('variant_locked_start_3');
  }, 30000));
  variantTimers.push(setTimeout(() => {
    narratorLine('variant_locked_start_4');
  }, 40000));
  variantTimers.push(setTimeout(() => {
    // Fade to black and auto-restart
    const fade = document.createElement('div');
    fade.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;opacity:0;transition:opacity 3s;z-index:9999;pointer-events:none';
    document.body.appendChild(fade);
    requestAnimationFrame(() => { fade.style.opacity = '1'; });
    variantTimers.push(setTimeout(() => {
      fade.remove();
      restartGame();
    }, 4000));
  }, 45000));
}

// ── EMPTY_WORLD variant (era 5) ──────────────────────

function startEmptyWorldSequence() {
  variantTimers.push(setTimeout(() => {
    narratorLine('variant_empty_world_1');
  }, 5000));
  variantTimers.push(setTimeout(() => {
    narratorLine('variant_empty_world_2');
  }, 12000));
  variantTimers.push(setTimeout(() => {
    narratorLine('variant_empty_world_3');
  }, 20000));
  variantTimers.push(setTimeout(() => {
    narratorLine('variant_empty_world_4');
  }, 30000));
  variantTimers.push(setTimeout(() => {
    // Auto-restart after conversation
    const fade = document.createElement('div');
    fade.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;opacity:0;transition:opacity 3s;z-index:9999;pointer-events:none';
    document.body.appendChild(fade);
    requestAnimationFrame(() => { fade.style.opacity = '1'; });
    variantTimers.push(setTimeout(() => {
      fade.remove();
      restartGame();
    }, 4000));
  }, 40000));
}

// ── SHOOTER_PARODY variant (era 5) ──────────────────

function startShooterParody() {
  // Add HUD overlay
  const hud = document.createElement('div');
  hud.id = 'variant-hud';
  hud.innerHTML = `
    <div style="position:fixed;top:20px;left:20px;color:#0f0;font-family:monospace;font-size:14px;text-shadow:0 0 4px #0f0;z-index:100">
      <div>HP: <span id="shooter-hp">100</span>/100</div>
      <div>AMMO: <span id="shooter-ammo">∞</span></div>
      <div>SCORE: <span id="shooter-score">0</span></div>
    </div>
    <div style="position:fixed;top:20px;right:20px;width:100px;height:100px;border:1px solid #0f0;opacity:0.3;z-index:100">
      <div style="position:absolute;top:50%;left:50%;width:4px;height:4px;background:#0f0;transform:translate(-50%,-50%)"></div>
    </div>
  `;
  document.body.appendChild(hud);

  // Create ghost "enemies" in hallway
  shooterState = { kills: 0, total: 4, done: false };

  // Override click to "shoot"
  const onShoot = (e) => {
    if (!gameState.is(State.PLAYING) || !shooterState || shooterState.done) return;
    const target = player.checkInteraction();
    // Check if looking at a ghost
    for (const ghost of activeGhosts) {
      if (ghost.userData.faded || ghost.userData.shot) continue;
      const dist = player.position.distanceTo(ghost.position);
      if (dist < 8.0) {
        // Check if roughly facing ghost
        const dir = new THREE.Vector3();
        player.camera.getWorldDirection(dir);
        const toGhost = ghost.position.clone().sub(player.position).normalize();
        if (dir.dot(toGhost) > 0.85) {
          ghost.userData.shot = true;
          fadeOutGhost(ghost);
          shooterState.kills++;
          // Score popup
          const popup = document.createElement('div');
          popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#ff0;font-family:monospace;font-size:24px;text-shadow:0 0 8px #ff0;z-index:100;pointer-events:none';
          popup.textContent = `+${shooterState.kills * 100}`;
          document.body.appendChild(popup);
          setTimeout(() => popup.remove(), 1500);
          const scoreEl = document.getElementById('shooter-score');
          if (scoreEl) scoreEl.textContent = String(shooterState.kills * 100);
          break;
        }
      }
    }
    // Check if all killed
    if (shooterState.kills >= shooterState.total && !shooterState.done) {
      shooterState.done = true;
      narratorLine('variant_shooter_done');
      variantTimers.push(setTimeout(() => {
        narratorLine('variant_shooter_sad');
        variantTimers.push(setTimeout(() => {
          const fade = document.createElement('div');
          fade.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;opacity:0;transition:opacity 3s;z-index:9999;pointer-events:none';
          document.body.appendChild(fade);
          requestAnimationFrame(() => { fade.style.opacity = '1'; });
          variantTimers.push(setTimeout(() => {
            fade.remove();
            document.removeEventListener('click', onShoot);
            restartGame();
          }, 4000));
        }, 5000));
      }, 3000));
    }
  };
  document.addEventListener('click', onShoot);
  // Store for cleanup
  shooterState._onShoot = onShoot;

  variantTimers.push(setTimeout(() => {
    narratorLine('variant_shooter_wake');
  }, 2000));
  variantTimers.push(setTimeout(() => {
    narratorLine('variant_shooter_taunt');
  }, 8000));
}

// ── ONE_ROOM variant (era 5) ──────────────────────

function startOneRoomSequence() {
  variantTimers.push(setTimeout(() => {
    narratorLine('variant_one_room_wake');
  }, 3000));
  variantTimers.push(setTimeout(() => {
    narratorLine('variant_one_room_explore');
  }, 15000));
  variantTimers.push(setTimeout(() => {
    narratorLine('variant_one_room_end');
  }, 30000));
  variantTimers.push(setTimeout(() => {
    const fade = document.createElement('div');
    fade.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;opacity:0;transition:opacity 3s;z-index:9999;pointer-events:none';
    document.body.appendChild(fade);
    requestAnimationFrame(() => { fade.style.opacity = '1'; });
    variantTimers.push(setTimeout(() => {
      fade.remove();
      restartGame();
    }, 4000));
  }, 40000));
}

// ── CCTV Mode (Era 6) ────────────────────────────────────

function startCCTVMode() {
  const pathType = Math.random() < 0.5 ? 'compliance' : 'defiance';
  gameState.set(State.CCTV);
  player.controls.unlock();

  // Disable postfx for CCTV — CSS overlay provides scanlines
  postfx.enabled = false;
  renderer.setExposure(2.8);
  renderer.setFogNear(15);
  renderer.setFogFar(50);

  // Build the map normally so the 3D scene is visible
  mapBuilder.clear();
  mapBuilder.collectedLore = memory.loreCollected;
  const result = mapBuilder.build(6, null);
  activeGhosts = result.ghosts || [];
  doorSystem = result.doorSystem;

  // Start CCTV replay
  cctvReplay.start(pathType, renderer.scene, renderer.camera, result);

  // On completion
  cctvReplay.onComplete = () => {
    memory.cctvSeen = true;
    memory.playthroughCount++;
    memory.save();
    restartGame();
  };
}

function stopCCTVMode() {
  cctvReplay.stop();
  gameState.set(State.MENU);
}

// ── Terminal Mode (Era 9) ────────────────────────────────

function startTerminalMode() {
  gameState.set(State.TERMINAL);
  player.controls.unlock();

  // Build map in background for the zoom-out reveal
  mapBuilder.clear();
  mapBuilder.collectedLore = memory.loreCollected;
  const result = mapBuilder.build(9, null);
  activeGhosts = result.ghosts || [];
  doorSystem = result.doorSystem;

  terminal.show();
  terminal.onShutdown = () => {
    terminal.hide();
    // Start Era 10 ending sequence (pass renderer object for 3D scene access)
    era10Ending.start(renderer, canvas,
      // onRestart — full reset, start from Era 1
      () => {
        memory.reset();
        location.reload();
      },
      // onReplay — re-experience Era 10 (terminal + ending)
      () => {
        memory.save();
        startTerminalMode();
      }
    );
  };
}

// ── Era 7 CCTV_MONITORS variant ──────────────────────────

function startCCTVMonitorVariant() {
  // CCTV monitor props are placed by map-builder via addMonitorProps
  // Here we set up interaction responses
  variantTimers.push(setTimeout(() => {
    narratorLine('variant_cctv_monitors_wake');
  }, 3000));
}

// ── Era 8 FRAGMENTED variant ────────────────────────────

function startFragmentedVariant() {
  // Heavier glitch, periodic spikes
  variantTimers.push(setTimeout(() => {
    narratorLine('variant_fragmented_wake');
  }, 3000));

  // Periodic glitch spikes every 30s
  let glitchInterval = setInterval(() => {
    if (!gameState.is(State.PLAYING)) return;
    postfx.setGlitch(0.3);
    setTimeout(() => postfx.setGlitch(0.01), 500);
  }, 30000);
  variantTimers.push(glitchInterval);
}

// ── Era Routing ──────────────────────────────────────────

function routeByEra(eraLevel) {
  if (eraLevel === 6) {
    startCCTVMode();
    return true;
  }
  if (eraLevel === 9) {
    startTerminalMode();
    return true;
  }
  return false; // normal play (era 1-5, 7-8)
}

// ── Environmental Reactions (defiance-based) ──────────────

function updateEnvironment() {
  const defiance = tracker.totalDefiance;
  const era = memory.getEra();
  // Only enable postfx at high defiance — subtle glitch effects
  if (defiance >= 6) {
    postfx.setNoise(0.01);
    postfx.setScanlines(0.015);
    postfx.enabled = true;
  } else if (defiance >= 4) {
    postfx.setScanlines(0.01);
    postfx.setNoise(0);
    postfx.enabled = true;
  } else if (era < 3) {
    // Only disable postfx when era atmosphere hasn't enabled it
    postfx.enabled = false;
  }
}

// ── Game Loop ──────────────────────────────────────────────

const clock = new THREE.Clock();
let frameCount = 0;

function gameLoop() {
  requestAnimationFrame(gameLoop);

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  frameCount++;

  // CCTV mode update
  if (gameState.is(State.CCTV)) {
    cctvReplay.update(delta);
    doorSystem.update(delta);
  }

  if (gameState.is(State.PLAYING)) {
    // Update player movement
    player.update(delta);

    // Update door animations
    doorSystem.update(delta);

    // Update trigger zones
    triggers.update(player.position);

    // Movement tracking
    const isMoving = player.moveForward || player.moveBackward || player.moveLeft || player.moveRight;
    if (isMoving) {
      narrator.notifyActivity();
    }

    // Time-based awareness: +1 every 5 minutes (300 seconds)
    if (memory.getEra() === 1 && awarenessLevel < 5) {
      const playSeconds = gameState.getPlayTime();
      const timeGrants = Math.floor(playSeconds / 300);
      if (timeGrants > lastAwarenessTimeGrant) {
        lastAwarenessTimeGrant = timeGrants;
        addAwareness(1, 'time');
      }
    }

    // Silence ending check (5 min keyboard idle — mouse can still move)
    if (gameState.updateIdleTime(delta, isMoving)) {
      gameState.silenceTriggered = true;
      triggerEnding('silence');
    }

    // Fourth wall ending: 5 min with no mouse AND no keyboard (era 4+)
    // Distinction: silence = no keyboard but mouse may move; fourth_wall = total inactivity
    if (!isMoving && !player.hasMouseMoved && memory.getEra() >= 4) {
      fourthWallTimer += delta;
      if (fourthWallTimer >= 120 && !gameState.silenceTriggered) {
        triggerEnding('fourth_wall');
      }
    } else {
      fourthWallTimer = 0;
    }

    // Acceptance ending: 60 seconds still in CONTROL_ROOM (era 5+)
    if (!isMoving && gameState.currentRoom === 'CONTROL_ROOM' && memory.getEra() >= 5 && !acceptanceTriggered) {
      acceptanceTimer += delta;
      if (acceptanceTimer >= 60) {
        acceptanceTriggered = true;
        narratorLine('acceptance_wait');
        setTimeout(() => triggerEnding('acceptance'), 5000);
      }
    } else if (isMoving || gameState.currentRoom !== 'CONTROL_ROOM') {
      acceptanceTimer = 0;
    }

    // Room tracking + audio + fog
    const room = mapBuilder.getRoomAtPosition(player.position);
    if (room && room.id !== gameState.currentRoom) {
      const firstVisit = gameState.enterRoom(room.id);
      audio.setAmbiance(AudioSystem.getRoomAmbianceType(room.id));
      mapBuilder.updateShadowsForRoom(room.id);

      // Per-room fog color (all eras use same brightness)
      if (room.fogColor) {
        renderer.setFogColor(room.fogColor);
      } else {
        renderer.setFogColor(0x1a1a25);
      }

      // Per-room fog distance overrides (reset to defaults when not specified)
      renderer.setFogNear(room.fogNear != null ? room.fogNear : 12);
      renderer.setFogFar(room.fogFar != null ? room.fogFar : 60);

      // Vignette flash on first visit
      if (firstVisit) {
        const vig = document.createElement('div');
        vig.className = 'room-transition';
        document.body.appendChild(vig);
        setTimeout(() => vig.remove(), 1300);
      }

      // Update environmental effects when entering new room
      updateEnvironment();

      // Ending checks at terminal rooms (priority: memory > escape > partnership > bargain > compassion)
      if (room.id === 'FALSE_ENDING_ROOM' || room.id === 'CONTROL_ROOM') {
        if (checkMemoryEnding()) {
          triggerEnding('memory_ending');
        } else if (checkEscapeEnding()) {
          triggerEnding('escape');
        } else if (checkPartnershipEnding()) {
          triggerEnding('partnership');
        } else if (checkBargainEnding()) {
          triggerEnding('bargain');
        } else if (checkCompassionEnding()) {
          triggerEnding('compassion');
        }
      }

      // Check awakening ending in experiment lab (era 3+)
      if (room.id === 'EXPERIMENT_LAB' && checkAwakeningEnding()) {
        triggerEnding('awakening');
      }
    }

    // Footstep audio
    const ambiType = AudioSystem.getRoomAmbianceType(gameState.currentRoom);
    audio.updateFootsteps(delta, isMoving, ambiType);

    // Interaction prompt (throttled)
    if (interactCooldown > 0) interactCooldown -= delta;
    if (frameCount % 6 === 0) {
      const lookingAt = player.checkInteraction();
      if (lookingAt && interactPrompt) {
        interactPrompt.style.display = 'block';
        if (lookingAt.type === 'door') {
          const lang = getLanguage();
          interactPrompt.textContent = lang === 'ko' ? 'E키를 눌러 문 열기' : 'Press E to open door';
        } else {
          const lang = getLanguage();
          interactPrompt.textContent = lang === 'ko' ? 'E키를 눌러 상호작용' : 'Press E to interact';
        }
      } else if (interactPrompt) {
        interactPrompt.style.display = 'none';
      }
    }

    // Ghost proximity check (every 30 frames)
    if (frameCount % 30 === 0 && activeGhosts.length > 0) {
      for (const ghost of activeGhosts) {
        if (ghost.userData.faded || ghost.userData.triggered) continue;
        const dist = player.position.distanceTo(ghost.position);
        if (dist < 3.0) {
          ghost.userData.triggered = true;
          if (ghost.userData.persistent) {
            // SUBJECT_CHAMBER ghost: look at player, don't fade
            ghost.lookAt(player.position.x, ghost.position.y, player.position.z);
            narratorLine('ghost_' + ghost.userData.ghostId + '_stare');
          } else {
            // Fade out over 3 seconds
            narratorLine('ghost_' + ghost.userData.ghostId + '_vanish');
            fadeOutGhost(ghost);
          }
        }
      }
    }

    // Valve wheel rotation animation
    if (valveAnim) {
      valveAnim.elapsed += delta;
      valveAnim.wheel.rotation.z += delta * Math.PI * 2.5;
      if (valveAnim.elapsed >= valveAnim.duration) valveAnim = null;
    }
  }

  // Era 10 ending: update + render to left monitor RT before main render
  if (era10Ending.active) {
    era10Ending.update(delta);
    era10Ending.render();
  }

  // Intermittent color shift spikes for era 4+ (brief glitch pulses)
  if (postfx.enabled && era >= 4) {
    // Base colorShift is subtle (set by applyEraAtmosphere)
    // Spike: random bursts lasting ~0.3s, every 8-15 seconds
    const spikeChance = era >= 7 ? 0.003 : era >= 5 ? 0.002 : 0.001; // per frame
    if (!postfx._colorSpike && Math.random() < spikeChance) {
      const peakShift = era >= 8 ? 0.03 : era >= 7 ? 0.025 : era >= 5 ? 0.02 : 0.015;
      postfx._colorSpike = { peak: peakShift, remaining: 0.25 + Math.random() * 0.15 };
    }
    if (postfx._colorSpike) {
      postfx._colorSpike.remaining -= delta;
      if (postfx._colorSpike.remaining <= 0) {
        // Restore base value
        const base = era >= 8 ? 0.015 : era >= 7 ? 0.012 : era >= 5 ? 0.008 : 0.005;
        postfx.setColorShift(base);
        postfx._colorSpike = null;
      } else {
        postfx.setColorShift(postfx._colorSpike.peak);
      }
    }
  }

  // Render — use postfx only when effects are active, otherwise direct render
  if (postfx.enabled) {
    postfx.update(elapsed);
    postfx.render();
  } else {
    renderer.render();
  }
}

// ── Init ──────────────────────────────────────────────────

// Era routing on initial boot (CCTV / terminal modes skip normal play)
if (routeByEra(era)) {
  console.log(`Boot: era=${era} → special mode`);
} else {
  ui.init();
  ui.showResetButton(memory.getEra() >= 2);
  const [startX, startY, startZ] = PLAYER_START.position;
  player.camera.position.set(startX, startY, startZ);
}

// postfx starts disabled — enabled by updateEnvironment when defiance kicks in

// Keyboard: skip narrator, interact
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && narrator.isBusy) {
    narrator.skip();
  }
  if (e.code === 'KeyF' && gameState.is(State.PLAYING) && inventory.has('flashlight')) {
    player.toggleFlashlight();
  }
});

// Handle resize
window.addEventListener('resize', () => {
  postfx.resize(window.innerWidth, window.innerHeight);
});

// Start game loop
gameLoop();

console.log('What Lies Beyond 2 - Initialized (expanded build)');
