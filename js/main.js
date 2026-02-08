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

// ── Build World ──────────────────────────────────────────

const era = memory.getEra();
mapBuilder.setLang(getLanguage());
const { colliders, triggerZones, interactables, ghosts } = mapBuilder.build(era);
player.setColliders(colliders);
player.setInteractables(interactables);
triggers.loadZones(triggerZones);
let activeGhosts = ghosts || [];
mapBuilder.updateShadowsForRoom('START_ROOM');

// Era-based atmospheric settings
applyEraAtmosphere(era);

// ── Era Atmosphere ──────────────────────────────────────

function applyEraAtmosphere(eraLevel) {
  if (eraLevel >= 5) {
    renderer.setFogColor(0x120505);
    renderer.setFogNear(7);
    renderer.setFogFar(40);
    renderer.setExposure(1.4);
    postfx.setNoise(0.04);
    postfx.setScanlines(0.08);
    postfx.enabled = true;
  } else if (eraLevel >= 4) {
    renderer.setFogColor(0x180808);
    renderer.setFogNear(8);
    renderer.setFogFar(45);
    renderer.setExposure(1.6);
    postfx.setNoise(0.02);
    postfx.setScanlines(0.04);
    postfx.setColorShift(0.4);
    postfx.enabled = true;
  } else if (eraLevel >= 3) {
    renderer.setFogColor(0x88bbee);
    renderer.setFogNear(15);
    renderer.setFogFar(50);
    renderer.setExposure(2.5);
    postfx.setPixelSize(0.004);
    postfx.enabled = true;
  }
  // Era 1-2: defaults are fine (fog 0x111118, exposure 2.0)
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

// Click-to-play: lock pointer
document.getElementById('click-to-play').addEventListener('click', () => {
  if (gameState.is(State.CLICK_TO_PLAY)) {
    player.lock();
  }
});

// Player lock/unlock
player.onLock = () => {
  gameState.set(State.PLAYING);
  audio.init();
  audio.setAmbiance(AudioSystem.getRoomAmbianceType(gameState.currentRoom));
};

player.onUnlock = () => {
  if (gameState.is(State.PLAYING)) {
    gameState.set(State.PAUSED);
  }
};

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
  codeField.value = '';
  codeField.focus();
  player.controls.unlock();
}

function closeCodeInput() {
  codeInputActive = false;
  codeOverlay.style.display = 'none';
}

if (codeField) {
  codeField.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      closeCodeInput();
      return;
    }
    if (e.code === 'Enter') {
      const code = codeField.value.trim();
      if (code === '7491') {
        closeCodeInput();
        narratorLine('security_code_correct');
        tracker.completePuzzle('security_code');
        // Unlock holding cells door
        mapBuilder.unlockDoor('SECURITY_CHECKPOINT', 'north');
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

    interactCooldown = 3;

    // Special prop interactions
    if (target.propId === 'keycard') {
      if (!inventory.has('keycard')) {
        inventory.add('keycard');
        narratorLine('keycard_pickup');
        showInventoryPopup('키카드 획득', 'Keycard Acquired');
      }
      return;
    }

    if (target.propId === 'cooling_console') {
      if (!tracker.puzzlesCompleted.has('cooling_fix')) {
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
      if (inventory.has('keycard')) {
        narratorLine('keycard_use');
        tracker.completePuzzle('keycard_used');
        showInventoryPopup('터미널 해금됨', 'Terminal Unlocked');
      } else {
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
    if (target.type === 'document' && target.propId) {
      const loreId = target.propId;
      if (!tracker.loreFound.has(loreId)) {
        tracker.findLore(loreId);
        addAwareness(2, 'lore');
        narratorLine(loreId);
        showInventoryPopup(`로어 발견 (${tracker.loreFound.size}/8)`, `Lore Found (${tracker.loreFound.size}/8)`);
      }
      return;
    }

    // Room-specific or type-based interaction
    const roomScript = `interact_${target.room}`;
    const typeMap = {
      'monitor': 'interact_monitor_default',
      'console': 'interact_console_default',
      'monitor_wall': 'interact_monitor_wall',
    };

    const lang = getLanguage();
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
  narratorLine('start_wake');
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
    narratorLine('decision_point');
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
      player.camera.position.set(0, 1.6, -4);
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
      player.camera.position.set(0, 1.6, -4);
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
  player.controls.unlock();
  endings.trigger(type);
}

// Check compassion ending conditions
function checkCompassionEnding() {
  const coolingFixed = tracker.puzzlesCompleted.has('cooling_fix');
  const rate = tracker.complianceRate;
  const midCompliance = rate >= 0.3 && rate <= 0.7;
  const hasHesitated = tracker.hesitations > 0;
  return coolingFixed && midCompliance && hasHesitated;
}

// Check partnership ending: balanced play + all puzzles
function checkPartnershipEnding() {
  const era = memory.getEra();
  if (era < 3) return false;
  const rate = tracker.complianceRate;
  const balanced = rate >= 0.35 && rate <= 0.65;
  const allPuzzles = tracker.puzzlesCompleted.size >= 3;
  return balanced && allPuzzles;
}

// Check memory ending: enough endings seen
function checkMemoryEnding() {
  return memory.endingsSeen.size >= 12;
}

// Check awakening ending: era 3+, in experiment lab
function checkAwakeningEnding() {
  return memory.getEra() >= 3 && gameState.visitedRooms.has('EXPERIMENT_LAB');
}

// Check bargain ending: era 4+, mid compliance, fewer than 3 puzzles
function checkBargainEnding() {
  const era = memory.getEra();
  if (era < 4) return false;
  const rate = tracker.complianceRate;
  return rate >= 0.35 && rate <= 0.65 && tracker.puzzlesCompleted.size < 3;
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

  gameState.reset();
  tracker.reset();
  narrator.reset();
  triggers.resetAll();
  triggers.setActive('loop_back', false);
  endings.hide();
  inventory.reset();
  idleCount = 0;
  wallBumpIndex = 0;
  awarenessPoints = 0;
  awarenessLevel = 0;
  awarenessSourceLog = [];
  lastAwarenessTimeGrant = 0;
  fourthWallTimer = 0;
  acceptanceTimer = 0;
  acceptanceTriggered = false;

  // Set narrator mode based on era for next playthrough
  if (memory.getEra() === 1) {
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
  postfx.enabled = false;
  renderer.setExposure(2.0);
  renderer.setFogColor(0x111118);
  renderer.setFogNear(10);
  renderer.setFogFar(55);

  // Apply era-based atmosphere for the new era (may have advanced after ending)
  applyEraAtmosphere(memory.getEra());

  // Close code input if open
  closeCodeInput();

  // Back to menu
  gameState.set(State.MENU);
  ui.init();
}

// ── Environmental Reactions (defiance-based) ──────────────

function updateEnvironment() {
  const defiance = tracker.totalDefiance;
  // Only enable postfx at high defiance — subtle glitch effects, no exposure change
  if (defiance >= 6) {
    postfx.setNoise(0.01);
    postfx.setScanlines(0.05);
    postfx.enabled = true;
  } else if (defiance >= 4) {
    postfx.setScanlines(0.03);
    postfx.setNoise(0);
    postfx.enabled = true;
  }
  // No exposure change — ambient-only lighting is already uniform
}

// ── Game Loop ──────────────────────────────────────────────

const clock = new THREE.Clock();
let frameCount = 0;

function gameLoop() {
  requestAnimationFrame(gameLoop);

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  frameCount++;

  if (gameState.is(State.PLAYING)) {
    // Update player movement
    player.update(delta);

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
      if (fourthWallTimer >= 300 && !gameState.silenceTriggered) {
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

      // Era 4+ overrides room fog with dark/red atmosphere
      const currentEra = memory.getEra();
      if (currentEra >= 5) {
        renderer.setFogColor(0x120505);
      } else if (currentEra >= 4) {
        renderer.setFogColor(0x180808);
      } else if (room.fogColor) {
        renderer.setFogColor(room.fogColor);
      } else {
        renderer.setFogColor(0x111118);
      }

      // Per-room fog distance overrides (e.g. outdoor rooms)
      if (room.fogNear != null) renderer.setFogNear(room.fogNear);
      if (room.fogFar != null) renderer.setFogFar(room.fogFar);

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

ui.init();

const [startX, startY, startZ] = PLAYER_START.position;
player.camera.position.set(startX, startY, startZ);

// postfx starts disabled — enabled by updateEnvironment when defiance kicks in

// Keyboard: skip narrator, interact
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && narrator.isBusy) {
    narrator.skip();
  }
});

// Handle resize
window.addEventListener('resize', () => {
  postfx.resize(window.innerWidth, window.innerHeight);
});

// Start game loop
gameLoop();

console.log('What Lies Beyond 2 - Initialized (expanded build)');
