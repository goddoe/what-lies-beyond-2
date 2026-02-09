/**
 * Run Variant System — Era 4+ map variations.
 *
 * Each variant defines:
 *  - id: unique identifier
 *  - era: minimum era required
 *  - weight: selection weight (higher = more likely)
 *  - mapMods: modifications to apply during map build
 *  - special: flag for special logic handled in main.js
 */

// ── Era 4 Variants (cynical/resigned, runs 7-9) ──────────

const ERA_4_VARIANTS = [
  {
    id: 'SEALED_LEFT',
    era: 4,
    weight: 1,
    mapMods: { removeDoors: [{ room: 'HALLWAY_1', wall: 'west' }] },
  },
  {
    id: 'SEALED_RIGHT',
    era: 4,
    weight: 1,
    mapMods: { removeDoors: [{ room: 'HALLWAY_1', wall: 'east' }] },
  },
  {
    id: 'LOCKED_START',
    era: 4,
    weight: 1,
    mapMods: { removeDoors: [{ room: 'START_ROOM', wall: 'north' }] },
    special: 'locked_start',
  },
  {
    id: 'SHORT_CIRCUIT',
    era: 4,
    weight: 1,
    mapMods: {
      keepRooms: ['START_ROOM', 'HALLWAY_1', 'CONTROL_ROOM'],
      removeDoors: [
        { room: 'HALLWAY_1', wall: 'west' },
        { room: 'HALLWAY_1', wall: 'east' },
      ],
      addDoors: [{ room: 'HALLWAY_1', wall: 'north', offset: 0, width: 2, height: 2.5 }],
      moveRooms: { 'CONTROL_ROOM': { origin: [0, 0, -31] } },
    },
    special: 'short_circuit',
  },
  {
    id: 'DARK_RUN',
    era: 4,
    weight: 1,
    mapMods: {},
    special: 'dark_run',
  },
  {
    id: 'DECAYED_MAP',
    era: 4,
    weight: 1,
    mapMods: {
      // Remove some intermediate rooms (dead-end branches) — doors auto-sealed
      removeRooms: [
        'BREAK_ROOM', 'OBSERVATION_DECK', 'RECORDS_ROOM', 'DIRECTOR_SUITE',
        'VENTILATION_SHAFT', 'COOLING_ROOM', 'REACTOR_CORE', 'MONITORING_STATION',
      ],
    },
    special: 'decayed_map',
  },
];

// ── Era 5 Variants (honest/reconciliation, runs 10+) ─────

const ERA_5_VARIANTS = [
  {
    id: 'EMPTY_WORLD',
    era: 5,
    weight: 1,
    mapMods: {
      keepRooms: ['START_ROOM', 'HALLWAY_1'],
      removeDoors: [
        { room: 'HALLWAY_1', wall: 'west' },
        { room: 'HALLWAY_1', wall: 'east' },
      ],
    },
    special: 'empty_world',
  },
  {
    id: 'SHOOTER_PARODY',
    era: 5,
    weight: 1,
    mapMods: {},
    special: 'shooter_parody',
  },
  {
    id: 'MIRROR',
    era: 5,
    weight: 1,
    mapMods: { mirrorX: true },
  },
  {
    id: 'ONE_ROOM',
    era: 5,
    weight: 1,
    mapMods: {
      keepRooms: [],
      customRooms: [{
        id: 'ONE_ROOM_SPACE',
        origin: [0, 0, -15],
        size: [30, 4, 30],
        wallColor: 0x3a3a4a,
        floorColor: 0x2a2a35,
        ceilingColor: 0x222230,
        lightColor: 0xddeeff,
        lightIntensity: 0.8,
        doors: [],
        triggers: [
          { id: 'start_wake', position: [0, 1, 12], size: [6, 3, 4] },
        ],
        props: [
          { type: 'desk', position: [-8, 0, -8], size: [1.2, 0.75, 0.6], color: 0x6b5b3a },
          { type: 'monitor', position: [-8, 0.75, -8], size: [0.5, 0.4, 0.05], color: 0x111111 },
          { type: 'rack', position: [8, 0, -8], size: [1.0, 2.0, 0.5], color: 0x334455 },
          { type: 'rack', position: [8, 0, -5], size: [1.0, 2.0, 0.5], color: 0x334455 },
          { type: 'console', position: [0, 0, -12], size: [0.8, 0.6, 0.4], color: 0x445566 },
          { type: 'cabinet', position: [-10, 0, 0], size: [0.6, 1.4, 0.4], color: 0x555566 },
          { type: 'desk', position: [5, 0, 5], size: [1.2, 0.75, 0.6], color: 0x5a4a32 },
          { type: 'chair', position: [5, 0, 6], size: [0.5, 0.5, 0.5], color: 0x333333 },
        ],
      }],
    },
    special: 'one_room',
  },
  {
    id: 'NORMAL',
    era: 5,
    weight: 3,  // higher weight — always a common choice
    mapMods: {},
  },
];

const ALL_VARIANTS = [...ERA_4_VARIANTS, ...ERA_5_VARIANTS];

/**
 * Select a variant for the given era.
 * @param {number} era - Current era (1-5)
 * @param {string|null} lastVariant - ID of the last variant used (to avoid repeats)
 * @returns {object|null} Variant config, or null if era < 4
 */
export function selectVariant(era, lastVariant = null) {
  if (era < 4) return null;

  const pool = ALL_VARIANTS.filter(v => era >= v.era);
  if (pool.length === 0) return null;

  // Filter out last variant to avoid immediate repeat (unless pool has only 1)
  let candidates = pool;
  if (lastVariant && pool.length > 1) {
    candidates = pool.filter(v => v.id !== lastVariant);
  }

  // Weighted random selection
  const totalWeight = candidates.reduce((sum, v) => sum + v.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const v of candidates) {
    rand -= v.weight;
    if (rand <= 0) return v;
  }
  return candidates[candidates.length - 1];
}

/**
 * Get variant by ID.
 */
export function getVariant(id) {
  return ALL_VARIANTS.find(v => v.id === id) || null;
}
