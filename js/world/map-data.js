/**
 * Map data definitions — 34 rooms.
 *
 * Coordinate system: +X = right, +Z = forward (into screen), Y = up.
 * Each room has an origin (world position of its center at floor level).
 *
 * Layout (top-down, Z points down on screen, player faces -Z):
 *
 *  START_ROOM (0,0,0)
 *       |  (hallway going -Z)
 *  HALLWAY_1 (0,0,-14)  -- decision point
 *       |
 *  -X <-+---+---> +X
 *   |               |
 *  LEFT           RIGHT
 *
 * Compliance path (left/-X, player's left when facing -Z):
 *   CORRIDOR_COMP_1 -> OFFICE_WING -> CORRIDOR_COMP_2 -> CONFERENCE -> ARCHIVE
 *                          |                                  |           |   \-> FORGOTTEN_WING
 *                      BREAK_ROOM              OBSERVATION_DECK  EXPERIMENT_LAB
 *                                         CORRIDOR_COMP_3 -> RECORDS_ROOM
 *                                              |
 *                                         UPPER_OFFICE -> DIRECTOR_SUITE
 *                                              |
 *                                         CORRIDOR_COMP_4
 *                                              |
 *                                         GARDEN_ANTECHAMBER
 *                                              |
 *                                         FALSE_ENDING_ROOM
 *
 * Defiance path (right/+X, player's right when facing -Z):
 *   CORRIDOR_DEF_1 -> MAINTENANCE -> CORRIDOR_DEF_2 -> SERVER_ROOM -> GENERATOR -> REACTOR_CORE
 *                        |   \                             |   \-> COOLING_ROOM
 *                   SECURITY  VENTILATION_SHAFT     CORRIDOR_DEF_3
 *                      |                                   |
 *                  HOLDING_CELLS                      DATA_CENTER -> DEEP_STORAGE
 *                                                      |   \-> MONITORING_STATION
 *                                                 CORRIDOR_DEF_4
 *                                                      |
 *                                                 CONTROL_ROOM
 *
 * Loop path (back/+Z from hallway):
 *   Teleport loop (no physical room)
 */

// Helper: create a room definition
function room(id, {
  origin,
  size,
  wallColor = 0x444455,
  floorColor = 0x333340,
  ceilingColor = 0x2a2a35,
  lightColor = 0xffffff,
  lightIntensity = 0.8,
  fogColor = null,
  doors = [],
  triggers = [],
  props = [],
  lightPos = null,
  noLight = false,
  eraMin = null,
}) {
  return {
    id,
    origin,          // [x, y, z]
    size,            // [width, height, depth]
    wallColor,
    floorColor,
    ceilingColor,
    lightColor,
    lightIntensity,
    fogColor,
    doors,           // [{wall: 'north'|'south'|'east'|'west', offset: 0, width: 2, height: 2.5}]
    triggers,        // [{id, position: [x,y,z], size: [w,h,d]}]  (relative to room origin)
    props,           // [{type, position, size, color}]
    lightPos,        // [x, y, z] relative to room origin, or null for center
    noLight,         // if true, skip creating a PointLight for this room
    eraMin,          // minimum era for this room to exist (null = always)
  };
}

export const ROOMS = [

  // ===================================================================
  // 1. START_ROOM
  // Origin: (0,0,0), Size: 6x3x6
  // Walls: N z=-3, S z=3, E x=3, W x=-3
  // ===================================================================
  room('START_ROOM', {
    origin: [0, 0, 0],
    size: [6, 3, 6],
    wallColor: 0x5a5a6a,
    floorColor: 0x3a3a45,
    lightColor: 0xffe8cc,
    lightIntensity: 1.0,
    doors: [
      { wall: 'north', offset: 0, width: 2, height: 2.5 },
    ],
    triggers: [
      { id: 'start_wake', position: [0, 1, 0], size: [4, 3, 4] },
    ],
    props: [
      // Desk with monitor
      { type: 'desk', position: [-1.5, 0, -1.5], size: [1.2, 0.75, 0.6], color: 0x6b5b3a },
      { type: 'monitor', position: [-1.5, 0.75, -1.5], size: [0.5, 0.55, 0.3], color: 0x111111 },
      { type: 'chair', position: [-1.5, 0, -0.8], size: [0.5, 0.5, 0.5], color: 0x333333, rotY: Math.PI },
      // Filing cabinet
      { type: 'cabinet', position: [2, 0, -2.2], size: [0.6, 1.4, 0.4], color: 0x555566 },
      // Waste basket
      { type: 'basket', position: [1.5, 0, 0.5], size: [0.3, 0.35, 0.3], color: 0x444444 },
      // Wall clock (decorative)
      { type: 'clock', position: [0, 2.2, -2.8], size: [0.4, 0.4, 0.05], color: 0x888888 },
      // Flashlight on cabinet (interactable)
      { type: 'flashlight', position: [2, 1.43, -2.2], size: [0.18, 0.05, 0.08], color: 0xaaaa44, id: 'flashlight_drawer' },
    ],
  }),

  // ===================================================================
  // 2. HALLWAY_1  (enlarged)
  // Origin: (0,0,-14), Size: 4x3x22
  // Walls: N z=-25, S z=-3, E x=2, W x=-2
  // ===================================================================
  room('HALLWAY_1', {
    origin: [0, 0, -14],
    size: [4, 3, 22],
    wallColor: 0x484858,
    floorColor: 0x333340,
    lightColor: 0xdde0ff,
    lightIntensity: 0.6,
    doors: [
      { wall: 'south', offset: 0, width: 2, height: 2.5 },   // from START
      { wall: 'west', offset: -7, width: 2, height: 2.5 },    // left door (compliance) at z=-21
      { wall: 'east', offset: -7, width: 2, height: 2.5 },    // right door (defiance) at z=-21
    ],
    triggers: [
      { id: 'hallway_enter', position: [0, 1, 7], size: [4, 3, 2] },
      { id: 'hallway_midpoint', position: [0, 1, 0], size: [4, 3, 2] },
      { id: 'decision_point', position: [0, 1, -4], size: [4, 3, 3] },
      { id: 'loop_back', position: [0, 1, 9], size: [4, 3, 2] },
    ],
    props: [
      // Hallway lights
      { type: 'light_fixture', position: [0, 2.8, 8], size: [0.3, 0.05, 0.3], color: 0xaaaacc },
      { type: 'light_fixture', position: [0, 2.8, 4], size: [0.3, 0.05, 0.3], color: 0xaaaacc },
      { type: 'light_fixture', position: [0, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0xaaaacc },
      { type: 'light_fixture', position: [0, 2.8, -4], size: [0.3, 0.05, 0.3], color: 0xaaaacc },
      { type: 'light_fixture', position: [0, 2.8, -8], size: [0.3, 0.05, 0.3], color: 0xaaaacc },
      // Direction signs near decision point (wall-mounted, edge against wall)
      { type: 'sign_left', position: [-1.8, 2.2, -7], size: [0.4, 0.2, 0.05], color: 0x4a6a4a },
      { type: 'sign_right', position: [1.8, 2.2, -7], size: [0.4, 0.2, 0.05], color: 0x6a4a4a },
    ],
  }),

  // ===================================================================
  // COMPLIANCE PATH (left/-X when facing -Z)
  // ===================================================================

  // ===================================================================
  // 3. CORRIDOR_COMP_1
  // Origin: (-9,0,-21), Size: 14x3x4, noLight
  // Walls: N z=-23, S z=-19, E x=-2, W x=-16
  // ===================================================================
  room('CORRIDOR_COMP_1', {
    origin: [-9, 0, -21],
    size: [14, 3, 4],
    wallColor: 0x464856,
    floorColor: 0x30303c,
    ceilingColor: 0x282833,
    lightIntensity: 0.6,
    doors: [
      { wall: 'east', offset: 0, width: 2, height: 2.5 },    // from HALLWAY_1
      { wall: 'west', offset: 0, width: 2, height: 2.5 },    // to OFFICE_WING
    ],
    triggers: [
      { id: 'corridor_comp1_enter', position: [5, 1, 0], size: [4, 3, 4] },
      { id: 'corridor_comp1_mid', position: [-2, 1, 0], size: [4, 3, 4] },
    ],
    props: [
      { type: 'light_fixture', position: [4, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0xaaaacc },
      { type: 'light_fixture', position: [0, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0xaaaacc },
      { type: 'light_fixture', position: [-4, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0xaaaacc },
    ],
  }),

  // ===================================================================
  // 4. OFFICE_WING  (enlarged from 10x3x6 to 14x3x10)
  // Origin: (-23,0,-21), Size: 14x3x10
  // Walls: N z=-26, S z=-16, E x=-16, W x=-30
  // ===================================================================
  room('OFFICE_WING', {
    origin: [-23, 0, -21],
    size: [14, 3, 10],
    wallColor: 0x5a6a5a,
    floorColor: 0x3a4540,
    lightColor: 0xfff5e0,
    lightIntensity: 0.9,
    doors: [
      { wall: 'east', offset: 0, width: 2, height: 2.5 },    // from CORRIDOR_COMP_1
      { wall: 'west', offset: 0, width: 2, height: 2.5 },    // to CORRIDOR_COMP_2
      { wall: 'south', offset: 0, width: 2, height: 2.5 },   // to BREAK_ROOM
    ],
    triggers: [
      { id: 'office_enter', position: [5, 1, 0], size: [4, 3, 6] },
      { id: 'office_deep', position: [-3, 1, 0], size: [4, 3, 6] },
    ],
    props: [
      // Row of desks with monitors (left side)
      { type: 'desk', position: [-3, 0, -3], size: [1.2, 0.75, 0.6], color: 0x7a6b4a },
      { type: 'desk', position: [-1, 0, -3], size: [1.2, 0.75, 0.6], color: 0x7a6b4a },
      { type: 'desk', position: [1, 0, -3], size: [1.2, 0.75, 0.6], color: 0x7a6b4a },
      { type: 'desk', position: [3, 0, -3], size: [1.2, 0.75, 0.6], color: 0x7a6b4a },
      { type: 'monitor', position: [-3, 0.75, -3], size: [0.5, 0.55, 0.3], color: 0x111111, id: 'office_login' },
      { type: 'monitor', position: [-1, 0.75, -3], size: [0.5, 0.55, 0.3], color: 0x111111, id: 'office_portal' },
      { type: 'monitor', position: [1, 0.75, -3], size: [0.5, 0.55, 0.3], color: 0x111111, id: 'office_code' },
      { type: 'monitor', position: [3, 0.75, -3], size: [0.5, 0.55, 0.3], color: 0x111111, id: 'office_login' },
      // Chairs (north row, facing desks)
      { type: 'chair', position: [-3, 0, -2], size: [0.5, 0.5, 0.5], color: 0x333333, rotY: Math.PI },
      { type: 'chair', position: [-1, 0, -2], size: [0.5, 0.5, 0.5], color: 0x333333, rotY: Math.PI },
      { type: 'chair', position: [1, 0, -2], size: [0.5, 0.5, 0.5], color: 0x333333, rotY: Math.PI },
      { type: 'chair', position: [3, 0, -2], size: [0.5, 0.5, 0.5], color: 0x333333, rotY: Math.PI },
      // Water cooler
      { type: 'cooler', position: [5.5, 0, 3], size: [0.3, 1.1, 0.3], color: 0xccccdd },
      // Whiteboard on north wall
      { type: 'whiteboard', position: [0, 1.2, -4.8], size: [2, 1, 0.05], color: 0xeeeef0 },
      // Second row of desks (filling enlarged space)
      { type: 'desk', position: [-3, 0, 1], size: [1.2, 0.75, 0.6], color: 0x7a6b4a },
      { type: 'desk', position: [-1, 0, 1], size: [1.2, 0.75, 0.6], color: 0x7a6b4a },
      { type: 'monitor', position: [-3, 0.75, 1], size: [0.5, 0.55, 0.3], color: 0x111111, id: 'office_portal' },
      { type: 'monitor', position: [-1, 0.75, 1], size: [0.5, 0.55, 0.3], color: 0x111111, id: 'office_code' },
      // Chairs (south row, facing desks)
      { type: 'chair', position: [-3, 0, 2], size: [0.5, 0.5, 0.5], color: 0x333333, rotY: Math.PI },
      { type: 'chair', position: [-1, 0, 2], size: [0.5, 0.5, 0.5], color: 0x333333, rotY: Math.PI },
      // Potted plant
      { type: 'plant', position: [-6, 0, 3.5], size: [0.3, 0.8, 0.3], color: 0x3a5a3a },
    ],
  }),

  // ===================================================================
  // 5. BREAK_ROOM  (unchanged size 6x3x6)
  // Origin: (-23,0,-13), Size: 6x3x6
  // Walls: N z=-16, S z=-10, E x=-20, W x=-26
  // ===================================================================
  room('BREAK_ROOM', {
    origin: [-23, 0, -13],
    size: [6, 3, 6],
    wallColor: 0x6a6a5a,
    floorColor: 0x454540,
    lightColor: 0xffddaa,
    lightIntensity: 0.8,
    doors: [
      { wall: 'north', offset: 0, width: 2, height: 2.5 },   // to OFFICE_WING
    ],
    triggers: [
      { id: 'break_room_enter', position: [0, 1, 0], size: [4, 3, 4] },
    ],
    props: [
      // Coffee machine + counter (north wall, west side)
      { type: 'coffee_machine', position: [-2, 0.9, -2.3], size: [0.4, 0.6, 0.3], color: 0x222222 },
      { type: 'counter', position: [-2, 0, -2.3], size: [1.5, 0.9, 0.5], color: 0x8a7a5a },
      // Microwave on counter
      { type: 'microwave', position: [-1.5, 0.9, -2.3], size: [0.35, 0.25, 0.3], color: 0xcccccc },
      // Plates/tray on counter
      { type: 'tray', position: [-2.5, 0.91, -2.3], size: [0.3, 0.03, 0.2], color: 0xccccbb },
      // Couch (south wall, back against wall)
      { type: 'couch', position: [1.5, 0, 2.2], size: [1.2, 0.6, 1.0], color: 0x5a5a4a, rotY: Math.PI },
      // Side table next to couch
      { type: 'table', position: [2.5, 0, 2.2], size: [0.5, 0.4, 0.5], color: 0x6b5b3a },
      // Small table (center-south) with chairs
      { type: 'table', position: [-0.5, 0, 1], size: [0.8, 0.5, 0.8], color: 0x6b5b3a },
      { type: 'chair', position: [-0.5, 0, 0.2], size: [0.4, 0.45, 0.4], color: 0x444433 },
      { type: 'chair', position: [-0.5, 0, 1.8], size: [0.4, 0.45, 0.4], color: 0x444433, rotY: Math.PI },
      // Plant on table
      { type: 'plant', position: [-0.2, 0.5, 0.8], size: [0.15, 0.25, 0.15], color: 0x3a6a3a },
      // Vending machine (NE corner)
      { type: 'vending', position: [2.2, 0, -2], size: [0.8, 1.8, 0.6], color: 0x3a3a5a },
      // Poster on west wall
      { type: 'poster', position: [-2.8, 1.5, 0], size: [0.05, 0.8, 0.6], color: 0x8888aa },
      // Bulletin board on south wall
      { type: 'poster', position: [0, 1.4, 2.8], size: [1, 0.7, 0.05], color: 0x8a7a5a },
      // Clock on south wall
      { type: 'clock', position: [2, 2.2, 2.8], size: [0.3, 0.3, 0.05], color: 0xdddddd },
      // Trash can
      { type: 'bin', position: [-2.5, 0, -1], size: [0.3, 0.4, 0.3], color: 0x555555 },
      // Floor rug (center)
      { type: 'rug', position: [0, 0.01, 0.5], size: [2.5, 0.02, 2], color: 0x6a5a4a },
      // Ceiling light
      { type: 'ceiling_light', position: [0, 2.9, 0], size: [0.6, 0.05, 0.6], color: 0xffffee },
    ],
  }),

  // ===================================================================
  // 6. CORRIDOR_COMP_2
  // Origin: (-37,0,-21), Size: 14x3x4, noLight
  // Walls: N z=-23, S z=-19, E x=-30, W x=-44
  // ===================================================================
  room('CORRIDOR_COMP_2', {
    origin: [-37, 0, -21],
    size: [14, 3, 4],
    wallColor: 0x4a4a5a,
    floorColor: 0x323240,
    ceilingColor: 0x282833,
    lightIntensity: 0.6,
    doors: [
      { wall: 'east', offset: 0, width: 2, height: 2.5 },    // from OFFICE_WING
      { wall: 'west', offset: 0, width: 2, height: 2.5 },    // to CONFERENCE
    ],
    triggers: [
      { id: 'corridor_comp2_enter', position: [4, 1, 0], size: [4, 3, 4] },
      { id: 'corridor_comp2_mid', position: [-3, 1, 0], size: [4, 3, 4] },
    ],
    props: [
      { type: 'light_fixture', position: [4, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0xaaaacc },
      { type: 'light_fixture', position: [0, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0xaaaacc },
      { type: 'light_fixture', position: [-4, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0xaaaacc },
    ],
  }),

  // ===================================================================
  // 7. CONFERENCE  (enlarged from 8x3x8 to 10x3x10)
  // Origin: (-49,0,-21), Size: 10x3x10
  // Walls: N z=-26, S z=-16, E x=-44, W x=-54
  // ===================================================================
  room('CONFERENCE', {
    origin: [-49, 0, -21],
    size: [10, 3, 10],
    wallColor: 0x5a5a70,
    floorColor: 0x3a3a48,
    lightColor: 0xfff8e8,
    lightIntensity: 1.0,
    doors: [
      { wall: 'east', offset: 0, width: 2, height: 2.5 },    // from CORRIDOR_COMP_2
      { wall: 'north', offset: 0, width: 2, height: 2.5 },   // to CORRIDOR_COMP_3
      { wall: 'west', offset: 0, width: 2, height: 2.5 },    // to ARCHIVE
      { wall: 'south', offset: 0, width: 2, height: 2.5 },   // to OBSERVATION_DECK
    ],
    triggers: [
      { id: 'conference_enter', position: [3, 1, 0], size: [3, 3, 6] },
      { id: 'conference_west', position: [-3, 1, 0], size: [3, 3, 6] },
    ],
    props: [
      // Large conference table
      { type: 'table', position: [0, 0, 0], size: [4, 0.75, 1.8], color: 0x5a4a3a },
      // Chairs around table
      { type: 'chair', position: [-2, 0, -2], size: [0.5, 0.5, 0.5], color: 0x333333 },
      { type: 'chair', position: [-1, 0, -2], size: [0.5, 0.5, 0.5], color: 0x333333 },
      { type: 'chair', position: [0, 0, -2], size: [0.5, 0.5, 0.5], color: 0x333333 },
      { type: 'chair', position: [1, 0, -2], size: [0.5, 0.5, 0.5], color: 0x333333 },
      { type: 'chair', position: [2, 0, -2], size: [0.5, 0.5, 0.5], color: 0x333333 },
      { type: 'chair', position: [-2, 0, 2], size: [0.5, 0.5, 0.5], color: 0x333333, rotY: Math.PI },
      { type: 'chair', position: [-1, 0, 2], size: [0.5, 0.5, 0.5], color: 0x333333, rotY: Math.PI },
      { type: 'chair', position: [0, 0, 2], size: [0.5, 0.5, 0.5], color: 0x333333, rotY: Math.PI },
      { type: 'chair', position: [1, 0, 2], size: [0.5, 0.5, 0.5], color: 0x333333, rotY: Math.PI },
      { type: 'chair', position: [2, 0, 2], size: [0.5, 0.5, 0.5], color: 0x333333, rotY: Math.PI },
      // Projector screen on north wall (offset left so north door stays visible)
      { type: 'screen', position: [-3, 1.2, -4.8], size: [2.5, 1.8, 0.05], color: 0xdddddd },
      // Projector on ceiling
      { type: 'projector', position: [0, 2.7, 0], size: [0.3, 0.2, 0.4], color: 0x444444 },
    ],
  }),

  // ===================================================================
  // 8. OBSERVATION_DECK  (NEW)
  // Origin: (-49,0,-12), Size: 8x3x8
  // Walls: N z=-16, S z=-8, E x=-45, W x=-53
  // ===================================================================
  room('OBSERVATION_DECK', {
    origin: [-49, 0, -12],
    size: [8, 3, 8],
    wallColor: 0x2a2a3a,
    floorColor: 0x1a1a28,
    ceilingColor: 0x222230,
    lightColor: 0x6688cc,
    lightIntensity: 0.5,
    fogColor: 0x0a0a1a,
    doors: [
      { wall: 'north', offset: 0, width: 2, height: 2.5 },   // to CONFERENCE
    ],
    triggers: [
      { id: 'observation_enter', position: [0, 1, -2], size: [6, 3, 3] },
      { id: 'observation_window', position: [0, 1, 1], size: [6, 3, 2] },
      { id: 'observation_deep', position: [0, 1, 3], size: [6, 3, 2] },
    ],
    props: [
      // Large observation window (dark panel)
      { type: 'window', position: [0, 0.8, 3.8], size: [6, 1.8, 0.05], color: 0x0a0a20 },
      // Railing in front of window
      { type: 'railing', position: [0, 0, 2.5], size: [6, 1, 0.1], color: 0x555566 },
      // Desk + monitor workstation (against west wall, screen faces room interior)
      { type: 'desk', position: [-3.5, 0, -1], size: [1.2, 0.75, 0.6], color: 0x333344, rotY: Math.PI / 2 },
      { type: 'monitor', position: [-3.4, 0.75, -1], size: [0.6, 0.55, 0.35], color: 0x111122, rotY: Math.PI / 2 },
      // Bench seating (against east wall)
      { type: 'bench', position: [3.5, 0, 0], size: [0.5, 0.4, 2], color: 0x3a3a4a },
      // Floor light accents
      { type: 'led', position: [-3, 0.05, 2.5], size: [0.1, 0.02, 4], color: 0x2244aa },
      { type: 'led', position: [3, 0.05, 2.5], size: [0.1, 0.02, 4], color: 0x2244aa },
      // Lore: architect's note (beside monitor on desk)
      { type: 'document', position: [-3.3, 0.76, -0.6], size: [0.3, 0.02, 0.2], color: 0x886611, id: 'lore_architects_note' },
    ],
  }),

  // ===================================================================
  // 9. ARCHIVE  (enlarged from 8x3x8 to 10x3x10)
  // Origin: (-59,0,-21), Size: 10x3x10
  // Walls: N z=-26, S z=-16, E x=-54, W x=-64
  // ===================================================================
  room('ARCHIVE', {
    origin: [-59, 0, -21],
    size: [10, 3, 10],
    wallColor: 0x4a4a3a,
    floorColor: 0x2a2a22,
    ceilingColor: 0x3a3a30,
    lightColor: 0xddcc99,
    lightIntensity: 0.5,
    doors: [
      { wall: 'east', offset: 0, width: 2, height: 2.5 },    // from CONFERENCE
      { wall: 'north', offset: 0, width: 1.5, height: 2.2 }, // to EXPERIMENT_LAB (narrow, hidden)
      { wall: 'west', offset: 0, width: 2, height: 2.5 },    // to FORGOTTEN_WING
    ],
    triggers: [
      { id: 'archive_enter', position: [3, 1, 0], size: [3, 3, 6] },
      { id: 'archive_deep', position: [-2, 1, -2], size: [3, 3, 3] },
      { id: 'archive_secret', position: [0, 1, -4.5], size: [2, 3, 1] },
    ],
    props: [
      // Filing cabinet rows (left wall, facing center +X)
      { type: 'cabinet', position: [-4, 0, -3], size: [0.6, 1.8, 0.5], color: 0x666655, rotY: Math.PI / 2 },
      { type: 'cabinet', position: [-4, 0, -1.5], size: [0.6, 1.8, 0.5], color: 0x666655, rotY: Math.PI / 2 },
      { type: 'cabinet', position: [-4, 0, 1.5], size: [0.6, 1.8, 0.5], color: 0x666655, rotY: Math.PI / 2 },
      { type: 'cabinet', position: [-4, 0, 3], size: [0.6, 1.8, 0.5], color: 0x666655, rotY: Math.PI / 2 },
      // Shelving units (right wall — avoid east door at offset 0)
      { type: 'shelf', position: [4, 0, -3], size: [0.5, 2.2, 1], color: 0x555544 },
      { type: 'shelf', position: [4, 0, 3], size: [0.5, 2.2, 1], color: 0x555544 },
      // Central reading desk
      { type: 'desk', position: [0, 0, 0], size: [1.5, 0.75, 1], color: 0x5a4a2a },
      // Scattered document boxes
      { type: 'box', position: [-1, 0, 3.5], size: [0.5, 0.4, 0.4], color: 0x8a7a5a },
      { type: 'box', position: [2, 0, 3.8], size: [0.4, 0.3, 0.3], color: 0x8a7a5a },
      // Desk lamp
      { type: 'lamp', position: [0.5, 0.75, 0], size: [0.15, 0.3, 0.15], color: 0xaaaa55 },
      // Lore: ethics committee report
      { type: 'document', position: [0, 0.76, -0.3], size: [0.3, 0.02, 0.2], color: 0x886611, id: 'lore_ethics_report' },
    ],
  }),

  // ===================================================================
  // 10. FORGOTTEN_WING  (NEW)
  // Origin: (-68,0,-21), Size: 8x3x8
  // Walls: N z=-25, S z=-17, E x=-64, W x=-72
  // ===================================================================
  room('FORGOTTEN_WING', {
    origin: [-68, 0, -21],
    size: [8, 3, 8],
    wallColor: 0x3a3a2a,
    floorColor: 0x1a1a15,
    ceilingColor: 0x2a2a22,
    lightColor: 0xccaa77,
    lightIntensity: 0.5,
    fogColor: 0x0a0a08,
    doors: [
      { wall: 'east', offset: 0, width: 2, height: 2.5 },    // from ARCHIVE
    ],
    triggers: [
      { id: 'forgotten_enter', position: [2, 1, 0], size: [3, 3, 6] },
      { id: 'forgotten_explore', position: [-1, 1, -2], size: [3, 3, 3] },
      { id: 'forgotten_terminal', position: [-2, 1, 2], size: [3, 3, 3] },
    ],
    props: [
      // Broken shelves
      { type: 'shelf', position: [-3, 0, -2.5], size: [0.5, 1.8, 1], color: 0x444433 },
      { type: 'shelf', position: [-3, 0, 1], size: [0.5, 1.2, 1], color: 0x444433 },
      // Overturned desk
      { type: 'desk', position: [1, 0, -1.5], size: [1.2, 0.75, 0.6], color: 0x5a4a2a },
      // Debris piles
      { type: 'debris', position: [0, 0, 2], size: [1, 0.2, 0.8], color: 0x333322 },
      { type: 'debris', position: [-2, 0, -1], size: [0.6, 0.15, 0.5], color: 0x333322 },
      // Old filing cabinet (broken, facing center -X)
      { type: 'cabinet', position: [3, 0, -3], size: [0.6, 1.4, 0.5], color: 0x555544, rotY: -Math.PI / 2 },
      // Dusty cobweb-like detail on ceiling
      { type: 'debris', position: [2, 2.5, -3], size: [1, 0.05, 1], color: 0x444433 },
      // Lore: experiment log entry 1
      { type: 'document', position: [1, 0.76, -1.5], size: [0.3, 0.02, 0.2], color: 0x886611, id: 'lore_experiment_log' },
    ],
  }),

  // ===================================================================
  // 11. EXPERIMENT_LAB
  // Origin: (-59,0,-29), Size: 8x3x6
  // Walls: N z=-32, S z=-26, E x=-55, W x=-63
  // ===================================================================
  room('EXPERIMENT_LAB', {
    origin: [-59, 0, -29],
    size: [8, 3, 6],
    wallColor: 0x5a5a5a,
    floorColor: 0x404040,
    ceilingColor: 0x4a4a4a,
    lightColor: 0xeeeeff,
    lightIntensity: 1.2,
    doors: [
      { wall: 'south', offset: 0, width: 1.5, height: 2.2 }, // from ARCHIVE
    ],
    triggers: [
      { id: 'lab_enter', position: [0, 1, 1], size: [4, 3, 3] },
      { id: 'lab_discovery', position: [0, 1, -1], size: [4, 3, 3] },
      { id: 'meta_ending', position: [0, 1, -2], size: [3, 3, 2] },
    ],
    props: [
      // Observation window (fake - just a dark panel)
      { type: 'window', position: [0, 0.8, -2.8], size: [4, 1.5, 0.05], color: 0x0a0a15 },
      // Lab bench
      { type: 'bench', position: [-2.5, 0, 0], size: [1.5, 0.9, 0.6], color: 0x888888 },
      // Equipment on bench
      { type: 'equipment', position: [-2.5, 0.9, 0], size: [0.4, 0.3, 0.3], color: 0x444455 },
      // Central terminal — desk + monitor
      { type: 'desk', position: [0, 0, 0.5], size: [1.2, 0.75, 0.6], color: 0x333344 },
      { type: 'monitor', position: [0, 0.75, 0.5], size: [0.6, 0.55, 0.35], color: 0x111122 },
      // Specimen jars (decorative boxes)
      { type: 'jar', position: [2.5, 0.9, 0], size: [0.15, 0.25, 0.15], color: 0x556655 },
      { type: 'jar', position: [2.7, 0.9, 0], size: [0.15, 0.25, 0.15], color: 0x556655 },
      { type: 'jar', position: [2.9, 0.9, 0], size: [0.15, 0.25, 0.15], color: 0x556655 },
      // Right bench
      { type: 'bench', position: [2.5, 0, 0], size: [1.5, 0.9, 0.6], color: 0x888888 },
      // Chair
      { type: 'chair', position: [0, 0, 1.5], size: [0.5, 0.5, 0.5], color: 0x333333 },
    ],
  }),

  // ===================================================================
  // 12. CORRIDOR_COMP_3
  // Origin: (-49,0,-33), Size: 4x3x14, noLight
  // Walls: N z=-40, S z=-26, E x=-47, W x=-51
  // ===================================================================
  room('CORRIDOR_COMP_3', {
    origin: [-49, 0, -33],
    size: [4, 3, 14],
    wallColor: 0x4a4a5e,
    floorColor: 0x323240,
    ceilingColor: 0x282833,
    lightIntensity: 0.6,
    doors: [
      { wall: 'south', offset: 0, width: 2, height: 2.5 },   // from CONFERENCE
      { wall: 'north', offset: 0, width: 2, height: 2.5 },   // to UPPER_OFFICE
      { wall: 'east', offset: 3, width: 2, height: 2.5 },    // to RECORDS_ROOM at z=-30
    ],
    triggers: [
      { id: 'corridor_comp3_enter', position: [0, 1, 5], size: [4, 3, 4] },
      { id: 'corridor_comp3_mid', position: [0, 1, -3], size: [4, 3, 4] },
    ],
    props: [
      { type: 'light_fixture', position: [0, 2.8, 4], size: [0.3, 0.05, 0.3], color: 0xaaaacc },
      { type: 'light_fixture', position: [0, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0xaaaacc },
      { type: 'light_fixture', position: [0, 2.8, -4], size: [0.3, 0.05, 0.3], color: 0xaaaacc },
    ],
  }),

  // ===================================================================
  // 13. RECORDS_ROOM  (NEW)
  // Origin: (-43,0,-30), Size: 8x3x6
  // Walls: N z=-33, S z=-27, E x=-39, W x=-47
  // ===================================================================
  room('RECORDS_ROOM', {
    origin: [-43, 0, -30],
    size: [8, 3, 6],
    wallColor: 0x5a5040,
    floorColor: 0x3a3228,
    ceilingColor: 0x3a3530,
    lightColor: 0xddbb88,
    lightIntensity: 0.6,
    doors: [
      { wall: 'west', offset: 0, width: 2, height: 2.5 },    // from CORRIDOR_COMP_3
    ],
    triggers: [
      { id: 'records_enter', position: [-2, 1, 0], size: [3, 3, 4] },
      { id: 'records_browse', position: [1, 1, -1], size: [3, 3, 3] },
      { id: 'records_discovery', position: [2, 1, 1], size: [3, 3, 3] },
    ],
    props: [
      // Dense filing cabinets (facing center -X)
      { type: 'cabinet', position: [3, 0, -2], size: [0.6, 1.8, 0.5], color: 0x666655, rotY: -Math.PI / 2 },
      { type: 'cabinet', position: [3, 0, -0.5], size: [0.6, 1.8, 0.5], color: 0x666655, rotY: -Math.PI / 2 },
      { type: 'cabinet', position: [3, 0, 1], size: [0.6, 1.8, 0.5], color: 0x666655, rotY: -Math.PI / 2 },
      { type: 'cabinet', position: [3, 0, 2.5], size: [0.6, 1.8, 0.5], color: 0x666655, rotY: -Math.PI / 2 },
      // Reading table
      { type: 'desk', position: [0, 0, 0], size: [1.5, 0.75, 1], color: 0x6b5b3a },
      // Document boxes
      { type: 'box', position: [-1.5, 0, 2], size: [0.5, 0.4, 0.4], color: 0x8a7a5a },
      { type: 'box', position: [-1, 0, -2], size: [0.4, 0.3, 0.3], color: 0x8a7a5a },
      // Desk lamp
      { type: 'lamp', position: [0.5, 0.75, 0], size: [0.15, 0.3, 0.15], color: 0xccaa55 },
      // Lore: subject 42 journal
      { type: 'document', position: [0, 0.76, 0.3], size: [0.3, 0.02, 0.2], color: 0x886611, id: 'lore_subject_42' },
    ],
  }),

  // ===================================================================
  // 14. UPPER_OFFICE
  // Origin: (-49,0,-43), Size: 8x3x6
  // Walls: N z=-46, S z=-40, E x=-45, W x=-53
  // ===================================================================
  room('UPPER_OFFICE', {
    origin: [-49, 0, -43],
    size: [8, 3, 6],
    wallColor: 0x6a6a7a,
    floorColor: 0x454550,
    lightColor: 0xfffff0,
    lightIntensity: 1.1,
    doors: [
      { wall: 'south', offset: 0, width: 2, height: 2.5 },   // from CORRIDOR_COMP_3
      { wall: 'north', offset: 0, width: 2, height: 2.5 },   // to CORRIDOR_COMP_4
      { wall: 'east', offset: 0, width: 2, height: 2.5 },    // to DIRECTOR_SUITE
    ],
    triggers: [
      { id: 'upper_office_enter', position: [0, 1, 1], size: [4, 3, 3] },
      { id: 'upper_office_desk', position: [0, 1, -1], size: [3, 3, 2] },
    ],
    props: [
      // Executive desk (compact, pushed against north wall)
      { type: 'desk', position: [2.5, 0, -2.5], size: [1.4, 0.8, 0.6], color: 0x8a7a5a },
      { type: 'monitor', position: [2.5, 0.8, -2.5], size: [0.6, 0.6, 0.35], color: 0x111111 },
      // Executive chair (facing desk)
      { type: 'chair', position: [2.5, 0, -1.5], size: [0.65, 0.7, 0.65], color: 0x1a1a1a, rotY: Math.PI },
      // Bookshelf
      { type: 'shelf', position: [-3.5, 0, 0], size: [0.5, 2.5, 2], color: 0x6a5a3a },
      // Certificates on wall (west wall, away from north door)
      { type: 'frame', position: [-3.8, 1.5, -1], size: [0.05, 0.3, 0.4], color: 0xaa9955 },
      { type: 'frame', position: [-3.8, 1.5, 0], size: [0.05, 0.3, 0.4], color: 0xaa9955 },
      { type: 'frame', position: [-3.8, 1.5, 1], size: [0.05, 0.3, 0.4], color: 0xaa9955 },
      // Floor plant
      { type: 'plant', position: [3, 0, -2], size: [0.3, 0.8, 0.3], color: 0x3a5a3a },
    ],
  }),

  // ===================================================================
  // 15. DIRECTOR_SUITE  (NEW)
  // Origin: (-41,0,-43), Size: 8x3x6
  // Walls: N z=-46, S z=-40, E x=-37, W x=-45
  // ===================================================================
  room('DIRECTOR_SUITE', {
    origin: [-41, 0, -43],
    size: [8, 3, 6],
    wallColor: 0x4a3a3a,
    floorColor: 0x2a2020,
    ceilingColor: 0x3a2a2a,
    lightColor: 0xffe8cc,
    lightIntensity: 0.8,
    doors: [
      { wall: 'west', offset: 0, width: 2, height: 2.5 },    // from UPPER_OFFICE
    ],
    triggers: [
      { id: 'director_enter', position: [-2, 1, 0], size: [3, 3, 4] },
      { id: 'director_desk', position: [1, 1, -1], size: [3, 3, 2] },
      { id: 'director_keycard', position: [2, 1, 0.5], size: [2, 3, 2] },
    ],
    props: [
      // Large executive desk (mahogany tones)
      { type: 'desk', position: [2, 0, -1], size: [2.5, 0.85, 1], color: 0x5a3a2a },
      { type: 'monitor', position: [2, 0.85, -1], size: [0.7, 0.65, 0.4], color: 0x111111 },
      // Leather chair (facing desk)
      { type: 'chair', position: [2, 0, 0.2], size: [0.7, 0.8, 0.7], color: 0x1a1010, rotY: Math.PI },
      // Bookshelf (large)
      { type: 'shelf', position: [3.5, 0, 0], size: [0.5, 2.5, 3], color: 0x5a3a2a },
      // Painting on wall
      { type: 'frame', position: [0, 1.5, -2.8], size: [1.5, 1, 0.05], color: 0x6a4a3a },
      // Keycard on desk (interactable)
      { type: 'document', position: [1.5, 0.86, -0.5], size: [0.15, 0.02, 0.1], color: 0xddcc44, id: 'keycard' },
      // Side table + lore: narrator specification document
      { type: 'desk', position: [-2, 0, -2.5], size: [0.8, 0.48, 0.5], color: 0x4a3a2a },
      { type: 'document', position: [-2, 0.49, -2.5], size: [0.3, 0.02, 0.2], color: 0x886611, id: 'lore_narrator_spec' },
    ],
  }),

  // ===================================================================
  // 16. CORRIDOR_COMP_4
  // Origin: (-49,0,-53), Size: 4x3x14, noLight
  // Walls: N z=-60, S z=-46, E x=-47, W x=-51
  // ===================================================================
  room('CORRIDOR_COMP_4', {
    origin: [-49, 0, -53],
    size: [4, 3, 14],
    wallColor: 0x4a5a4a,
    floorColor: 0x303830,
    ceilingColor: 0x283028,
    lightIntensity: 0.6,
    doors: [
      { wall: 'south', offset: 0, width: 2, height: 2.5 },   // from UPPER_OFFICE
      { wall: 'north', offset: 0, width: 2, height: 2.5 },   // to GARDEN_ANTECHAMBER
    ],
    triggers: [
      { id: 'corridor_comp4_enter', position: [0, 1, 5], size: [4, 3, 4] },
      { id: 'corridor_comp4_mid', position: [0, 1, -3], size: [4, 3, 4] },
    ],
    props: [
      { type: 'light_fixture', position: [0, 2.8, 4], size: [0.3, 0.05, 0.3], color: 0xaaccaa },
      { type: 'light_fixture', position: [0, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0xaaccaa },
      { type: 'light_fixture', position: [0, 2.8, -4], size: [0.3, 0.05, 0.3], color: 0xaaccaa },
    ],
  }),

  // ===================================================================
  // 17. GARDEN_ANTECHAMBER  (NEW)
  // Origin: (-49,0,-63), Size: 8x3x6
  // Walls: N z=-66, S z=-60, E x=-45, W x=-53
  // ===================================================================
  room('GARDEN_ANTECHAMBER', {
    origin: [-49, 0, -63],
    size: [8, 3, 6],
    wallColor: 0x5a6a5a,
    floorColor: 0x3a4a3a,
    ceilingColor: 0x4a5a4a,
    lightColor: 0xddeedd,
    lightIntensity: 0.7,
    doors: [
      { wall: 'south', offset: 0, width: 2, height: 2.5 },   // from CORRIDOR_COMP_4
      { wall: 'north', offset: 0, width: 2, height: 2.5, locked: 'keycard' },   // to FALSE_ENDING_ROOM (keycard required)
    ],
    triggers: [
      { id: 'garden_ante_enter', position: [0, 1, 1], size: [6, 3, 3] },
      { id: 'garden_ante_deep', position: [0, 1, -1.5], size: [6, 3, 3] },
    ],
    props: [
      // Potted plants (transition to garden)
      { type: 'plant', position: [-3, 0, -2], size: [0.4, 1, 0.4], color: 0x3a6a3a },
      { type: 'plant', position: [3, 0, -2], size: [0.4, 1, 0.4], color: 0x3a6a3a },
      { type: 'plant', position: [-3, 0, 1], size: [0.4, 0.8, 0.4], color: 0x4a7a4a },
      { type: 'plant', position: [3, 0, 1], size: [0.4, 0.8, 0.4], color: 0x4a7a4a },
      // Decorative vine trellis on walls
      { type: 'trellis', position: [-3.8, 0.5, 0], size: [0.05, 2, 3], color: 0x446644 },
      { type: 'trellis', position: [3.8, 0.5, 0], size: [0.05, 2, 3], color: 0x446644 },
      // Stone bench
      { type: 'bench', position: [0, 0, 0], size: [2, 0.4, 0.6], color: 0x888888 },
      // Terminal desk + console (keycard activated, shifted west to clear north door)
      { type: 'desk', position: [-3, 0, -1.5], size: [1.2, 0.6, 0.6], color: 0x5a5a4a },
      { type: 'console', position: [-3, 0.6, -1.5], size: [0.5, 0.55, 0.3], color: 0x445544, id: 'garden_terminal' },
    ],
  }),

  // ===================================================================
  // 18. FALSE_ENDING_ROOM  (enlarged from 10x4x10 to 12x4x12)
  // Origin: (-49,0,-72), Size: 12x4x12
  // Walls: N z=-78, S z=-66, E x=-43, W x=-55
  // ===================================================================
  room('FALSE_ENDING_ROOM', {
    origin: [-49, 0, -72],
    size: [12, 4, 12],
    noCeiling: true,               // outdoor — no ceiling
    wallColor: 0xaab8aa,           // bright grey-green (exterior wall feel)
    floorColor: 0x5a8a4a,          // bright grass green
    ceilingColor: 0x88bbee,        // unused (noCeiling)
    lightColor: 0xfff8e0,
    lightIntensity: 2.0,           // brighter (outdoor)
    fogColor: 0x88aacc,            // bright sky-blue fog (outdoor feel)
    fogNear: 12,                   // distant fog (openness)
    fogFar: 35,
    doors: [
      { wall: 'south', offset: 0, width: 2, height: 2.5 },
    ],
    triggers: [
      { id: 'false_ending_enter', position: [0, 1, 3], size: [8, 4, 4] },
      { id: 'false_ending', position: [0, 1, -1], size: [6, 4, 4] },
    ],
    props: [
      // EXIT sign (above entrance, bright LED)
      { type: 'led', position: [0, 3.2, 5.5], size: [1.5, 0.4, 0.1], color: 0x44ff44 },
      // Trees (outdoor park)
      { type: 'tree', position: [-4, 0, -4], size: [0.8, 2.5, 0.8], color: 0x3a7a3a },
      { type: 'tree', position: [4, 0, -4], size: [0.8, 2.5, 0.8], color: 0x3a7a3a },
      { type: 'tree', position: [-4, 0, 2], size: [0.8, 2.5, 0.8], color: 0x3a8a3a },
      { type: 'tree', position: [4, 0, 2], size: [0.8, 2.5, 0.8], color: 0x3a8a3a },
      // Grass (wide single patch)
      { type: 'grass', position: [0, 0.01, 0], size: [10, 0.02, 10], color: 0x4a8a4a },
      // Benches (park)
      { type: 'bench', position: [-3, 0, -1], size: [0.5, 0.4, 1.5], color: 0x6a5a3a },
      { type: 'bench', position: [3, 0, -1], size: [0.5, 0.4, 1.5], color: 0x6a5a3a },
      // Fountain
      { type: 'fountain', position: [0, 0, -2], size: [1.5, 0.5, 1.5], color: 0xaaaaaa },
      // "Sky" — bright LED panel high above (simulates sky when looking up)
      { type: 'led', position: [0, 5, 0], size: [12, 0.1, 12], color: 0x99ccee },
    ],
  }),

  // ===================================================================
  // DEFIANCE PATH (right/+X when facing -Z)
  // ===================================================================

  // ===================================================================
  // 19. CORRIDOR_DEF_1
  // Origin: (9,0,-21), Size: 14x3x4, noLight
  // Walls: N z=-23, S z=-19, E x=16, W x=2
  // ===================================================================
  room('CORRIDOR_DEF_1', {
    origin: [9, 0, -21],
    size: [14, 3, 4],
    wallColor: 0x444840,
    floorColor: 0x282825,
    ceilingColor: 0x282828,
    lightIntensity: 0.6,
    doors: [
      { wall: 'west', offset: 0, width: 2, height: 2.5 },    // from HALLWAY_1
      { wall: 'east', offset: 0, width: 2, height: 2.5 },    // to MAINTENANCE
    ],
    triggers: [
      { id: 'corridor_def1_enter', position: [-5, 1, 0], size: [4, 3, 4] },
      { id: 'corridor_def1_mid', position: [2, 1, 0], size: [4, 3, 4] },
    ],
    props: [
      { type: 'light_fixture', position: [-4, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0xccaa88 },
      { type: 'light_fixture', position: [0, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0xccaa88 },
      { type: 'light_fixture', position: [4, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0xccaa88 },
      // Overhead pipe
      { type: 'pipe', position: [0, 2.4, -1.5], size: [14, 0.12, 0.12], color: 0x555544 },
    ],
  }),

  // ===================================================================
  // 20. MAINTENANCE  (enlarged from 8x3x6 to 12x3x8)
  // Origin: (22,0,-21), Size: 12x3x8
  // Walls: N z=-25, S z=-17, E x=28, W x=16
  // ===================================================================
  room('MAINTENANCE', {
    origin: [22, 0, -21],
    size: [12, 3, 8],
    wallColor: 0x4a4a40,
    floorColor: 0x2a2a25,
    lightColor: 0xccaa80,
    lightIntensity: 0.6,
    doors: [
      { wall: 'west', offset: 0, width: 2, height: 2.5 },    // from CORRIDOR_DEF_1
      { wall: 'east', offset: 0, width: 2, height: 2.5 },    // to CORRIDOR_DEF_2
      { wall: 'north', offset: 0, width: 1.5, height: 2.2 }, // to SECURITY_CHECKPOINT
      { wall: 'south', offset: 0, width: 2, height: 2.5 },   // to VENTILATION_SHAFT
    ],
    triggers: [
      { id: 'maintenance_enter', position: [-4, 1, 0], size: [3, 3, 6] },
      { id: 'maintenance_deep', position: [3, 1, 0], size: [3, 3, 6] },
    ],
    props: [
      // Overhead pipes
      { type: 'pipe', position: [-3, 2.2, 0], size: [0.12, 0.12, 8], color: 0x666655 },
      { type: 'pipe', position: [3, 2.4, 0], size: [0.12, 0.12, 8], color: 0x666655 },
      { type: 'pipe_vert', position: [-5.5, 1.2, -3], size: [0.12, 2.4, 0.12], color: 0x666655 },
      // Supply crates near vent entrance
      { type: 'crate', position: [-2, 0, 2.5], size: [0.8, 0.6, 0.6], color: 0x6a5a3a },
      { type: 'crate', position: [-1.1, 0, 2.7], size: [0.6, 0.5, 0.5], color: 0x5a4a30 },
      { type: 'crate', position: [-1.8, 0.6, 2.5], size: [0.5, 0.4, 0.5], color: 0x6a5a3a },
      // Tool shelf
      { type: 'shelf', position: [5, 0, 2.5], size: [0.4, 1.5, 1], color: 0x555544 },
      // Warning stripes (floor marking)
      { type: 'stripe', position: [0, 0.01, -3.5], size: [12, 0.02, 0.3], color: 0xaaaa00 },
      // Electrical panel (shifted south along west wall, away from west door)
      { type: 'panel', position: [-5.8, 0.8, 3], size: [0.1, 1, 0.8], color: 0x444444 },
      // Additional workbench for enlarged room
      { type: 'bench', position: [4, 0, -2], size: [1.5, 0.9, 0.6], color: 0x555544 },
    ],
  }),

  // ===================================================================
  // 21. VENTILATION_SHAFT  (NEW)
  // Origin: (22,0,-11), Size: 4x3x12
  // Walls: N z=-17, S z=-5, E x=24, W x=20
  // ===================================================================
  room('VENTILATION_SHAFT', {
    origin: [22, 0, -11],
    size: [4, 3, 12],
    wallColor: 0x5a4a3a,
    floorColor: 0x2a2218,
    ceilingColor: 0x3a3028,
    lightColor: 0xcc8855,
    lightIntensity: 0.5,
    doors: [
      { wall: 'north', offset: 0, width: 2, height: 2.5 },   // from MAINTENANCE
    ],
    triggers: [
      { id: 'vent_enter', position: [0, 1, -4], size: [3, 3, 3] },
      { id: 'vent_message', position: [0, 1, 0], size: [3, 3, 3] },
      { id: 'vent_deep', position: [0, 1, 3], size: [3, 3, 3] },
    ],
    props: [
      // Overhead ducts
      { type: 'pipe', position: [0, 2.3, 0], size: [0.4, 0.4, 12], color: 0x666655 },
      // Grate flooring
      { type: 'grate', position: [0, 0.01, 0], size: [3.5, 0.02, 10], color: 0x444433 },
      // Fan housing
      { type: 'equipment', position: [0, 2, 4], size: [1.5, 0.8, 1], color: 0x555544 },
      // Rust stains (floor detail)
      { type: 'debris', position: [1, 0.02, -2], size: [0.5, 0.01, 0.5], color: 0x6a4422 },
      { type: 'debris', position: [-0.5, 0.02, 3], size: [0.3, 0.01, 0.4], color: 0x6a4422 },
    ],
  }),

  // ===================================================================
  // 22. SECURITY_CHECKPOINT  (enlarged from 4x3x4 to 6x3x6)
  // Origin: (22,0,-28), Size: 6x3x6
  // Walls: N z=-31, S z=-25, E x=25, W x=19
  // ===================================================================
  room('SECURITY_CHECKPOINT', {
    origin: [22, 0, -28],
    size: [6, 3, 6],
    wallColor: 0x505060,
    floorColor: 0x303038,
    lightColor: 0xffffff,
    lightIntensity: 0.7,
    doors: [
      { wall: 'south', offset: 0, width: 1.5, height: 2.2 }, // from MAINTENANCE
      { wall: 'north', offset: 0, width: 2, height: 2.5, locked: true },   // to HOLDING_CELLS (locked, code 7491)
    ],
    triggers: [
      { id: 'security_enter', position: [0, 1, 1], size: [4, 3, 3] },
      { id: 'security_check', position: [0, 1, -1], size: [4, 3, 3] },
    ],
    props: [
      // Security desk
      { type: 'desk', position: [0, 0, -0.5], size: [3, 0.8, 0.6], color: 0x555566 },
      // Security monitors (multiple small screens)
      { type: 'monitor', position: [-0.8, 0.8, -0.5], size: [0.4, 0.45, 0.25], color: 0x111122 },
      { type: 'monitor', position: [0, 0.8, -0.5], size: [0.4, 0.45, 0.25], color: 0x111122 },
      { type: 'monitor', position: [0.8, 0.8, -0.5], size: [0.4, 0.45, 0.25], color: 0x111122 },
      // Chair (facing desk/monitors)
      { type: 'chair', position: [0, 0, 0.5], size: [0.5, 0.5, 0.5], color: 0x333333, rotY: Math.PI },
      // Security code terminal (interactable) — desk + console
      { type: 'desk', position: [2.5, 0, -2.5], size: [0.8, 0.5, 0.5], color: 0x444455 },
      { type: 'console', position: [2.5, 0.5, -2.5], size: [0.4, 0.55, 0.3], color: 0x333344, id: 'security_terminal' },
      // Metal detector frame (wall-mounted, not blocking path)
      { type: 'frame', position: [-2.8, 0.8, 0], size: [0.1, 1.2, 0.8], color: 0x777788 },
    ],
  }),

  // ===================================================================
  // 23. HOLDING_CELLS  (NEW)
  // Origin: (22,0,-34), Size: 8x3x6
  // Walls: N z=-37, S z=-31, E x=26, W x=18
  // ===================================================================
  room('HOLDING_CELLS', {
    origin: [22, 0, -34],
    size: [8, 3, 6],
    wallColor: 0x4a4a55,
    floorColor: 0x282830,
    ceilingColor: 0x303038,
    lightColor: 0xccccee,
    lightIntensity: 0.65,
    doors: [
      { wall: 'south', offset: 0, width: 2, height: 2.5 },   // from SECURITY_CHECKPOINT
    ],
    triggers: [
      { id: 'holding_enter', position: [0, 1, 1], size: [6, 3, 3] },
      { id: 'holding_cells_inspect', position: [0, 1, -0.5], size: [6, 3, 2] },
      { id: 'holding_revelation', position: [0, 1, -2], size: [6, 3, 2] },
    ],
    props: [
      // Cell dividers (vertical bars effect - tall thin walls)
      { type: 'bars', position: [-2, 0, -1], size: [0.1, 2.5, 3], color: 0x666677 },
      { type: 'bars', position: [2, 0, -1], size: [0.1, 2.5, 3], color: 0x666677 },
      // Bench inside left cell
      { type: 'bench', position: [-3, 0, -1], size: [1, 0.4, 0.6], color: 0x555555 },
      // Bench inside right cell
      { type: 'bench', position: [3, 0, -1], size: [1, 0.4, 0.6], color: 0x555555 },
      // Central walkway guard desk
      { type: 'desk', position: [0, 0, 1.5], size: [1.5, 0.8, 0.6], color: 0x555566 },
      // Warning light
      { type: 'warning_light', position: [0, 2.5, -2.5], size: [0.2, 0.2, 0.2], color: 0xff4444 },
      // Lore: shutdown order
      { type: 'document', position: [0, 0.81, 1.5], size: [0.3, 0.02, 0.2], color: 0x886611, id: 'lore_shutdown_order' },
    ],
  }),

  // ===================================================================
  // 24. CORRIDOR_DEF_2
  // Origin: (35,0,-21), Size: 14x3x4, noLight
  // Walls: N z=-23, S z=-19, E x=42, W x=28
  // ===================================================================
  room('CORRIDOR_DEF_2', {
    origin: [35, 0, -21],
    size: [14, 3, 4],
    wallColor: 0x2a2a35,
    floorColor: 0x1a1a22,
    ceilingColor: 0x222228,
    lightIntensity: 0.6,
    doors: [
      { wall: 'west', offset: 0, width: 2, height: 2.5 },    // from MAINTENANCE
      { wall: 'east', offset: 0, width: 2, height: 2.5 },    // to SERVER_ROOM
    ],
    triggers: [
      { id: 'corridor_def2_enter', position: [-4, 1, 0], size: [4, 3, 4] },
      { id: 'corridor_def2_mid', position: [3, 1, 0], size: [4, 3, 4] },
    ],
    props: [
      { type: 'light_fixture', position: [-4, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0x6688cc },
      { type: 'light_fixture', position: [0, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0x6688cc },
      { type: 'light_fixture', position: [4, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0x6688cc },
      // Cable run
      { type: 'cable', position: [0, 0.02, -1.5], size: [14, 0.04, 0.2], color: 0x1a1a2a },
    ],
  }),

  // ===================================================================
  // 25. SERVER_ROOM  (enlarged from 8x3x8 to 12x3x10)
  // Origin: (48,0,-21), Size: 12x3x10
  // Walls: N z=-26, S z=-16, E x=54, W x=42
  // ===================================================================
  room('SERVER_ROOM', {
    origin: [48, 0, -21],
    size: [12, 3, 10],
    wallColor: 0x2a2a3a,
    floorColor: 0x1a1a25,
    lightColor: 0x6688ff,
    lightIntensity: 0.7,
    fogColor: 0x0a0a1a,
    doors: [
      { wall: 'west', offset: 0, width: 2, height: 2.5 },    // from CORRIDOR_DEF_2
      { wall: 'north', offset: 0, width: 2, height: 2.5 },   // to CORRIDOR_DEF_3
      { wall: 'east', offset: 0, width: 2, height: 2.5 },    // to GENERATOR
      { wall: 'south', offset: -3, width: 2, height: 2.5 },  // to COOLING_ROOM (door at x=45)
    ],
    triggers: [
      { id: 'server_enter', position: [-4, 1, 0], size: [3, 3, 6] },
      { id: 'server_deep', position: [3, 1, 0], size: [3, 3, 6] },
    ],
    props: [
      // Server racks - left row (front faces center aisle +X)
      { type: 'rack', position: [-4.5, 0, -3.5], size: [1, 2.5, 0.6], color: 0x1a1a2a, rotY: Math.PI / 2 },
      { type: 'rack', position: [-4.5, 0, -1.5], size: [1, 2.5, 0.6], color: 0x1a1a2a, rotY: Math.PI / 2 },
      { type: 'rack', position: [-4.5, 0, 1.5], size: [1, 2.5, 0.6], color: 0x1a1a2a, rotY: Math.PI / 2 },
      { type: 'rack', position: [-4.5, 0, 3.5], size: [1, 2.5, 0.6], color: 0x1a1a2a, rotY: Math.PI / 2 },
      // Server racks - right row (front faces center aisle -X)
      { type: 'rack', position: [4.5, 0, -3.5], size: [1, 2.5, 0.6], color: 0x1a1a2a, rotY: -Math.PI / 2 },
      { type: 'rack', position: [4.5, 0, -1.5], size: [1, 2.5, 0.6], color: 0x1a1a2a, rotY: -Math.PI / 2 },
      { type: 'rack', position: [4.5, 0, 1.5], size: [1, 2.5, 0.6], color: 0x1a1a2a, rotY: -Math.PI / 2 },
      { type: 'rack', position: [4.5, 0, 3.5], size: [1, 2.5, 0.6], color: 0x1a1a2a, rotY: -Math.PI / 2 },
      // Blue LED strips (rotated with racks)
      { type: 'led', position: [-4.5, 1.5, -3.5], size: [0.02, 0.05, 0.6], color: 0x2244ff, rotY: Math.PI / 2 },
      { type: 'led', position: [-4.5, 1.5, -1.5], size: [0.02, 0.05, 0.6], color: 0x2244ff, rotY: Math.PI / 2 },
      { type: 'led', position: [4.5, 1.5, -3.5], size: [0.02, 0.05, 0.6], color: 0x2244ff, rotY: -Math.PI / 2 },
      { type: 'led', position: [4.5, 1.5, -1.5], size: [0.02, 0.05, 0.6], color: 0x2244ff, rotY: -Math.PI / 2 },
      // Cable runs on floor
      { type: 'cable', position: [0, 0.02, 0], size: [0.3, 0.04, 10], color: 0x222233 },
      // Center monitoring station
      { type: 'desk', position: [0, 0, 0], size: [1.5, 0.75, 0.6], color: 0x222233 },
      { type: 'monitor', position: [0, 0.75, 0], size: [0.5, 0.55, 0.3], color: 0x111122 },
    ],
  }),

  // ===================================================================
  // 26. COOLING_ROOM  (NEW)
  // Origin: (46,0,-13), Size: 8x3x6
  // Walls: N z=-16, S z=-10, E x=50, W x=42
  // Door on north at x=45 connects to SERVER_ROOM south door at offset -3
  // ===================================================================
  room('COOLING_ROOM', {
    origin: [46, 0, -13],
    size: [8, 3, 6],
    wallColor: 0x3a4a5a,
    floorColor: 0x222830,
    ceilingColor: 0x2a3038,
    lightColor: 0x88aaee,
    lightIntensity: 0.65,
    doors: [
      { wall: 'north', offset: -1, width: 2, height: 2.5 },   // to SERVER_ROOM (door at x=45)
    ],
    triggers: [
      { id: 'cooling_enter', position: [0, 1, -1.5], size: [6, 3, 3] },
      { id: 'cooling_deep', position: [0, 1, 1.5], size: [6, 3, 3] },
    ],
    props: [
      // Cooling units (big industrial boxes, facing center)
      { type: 'equipment', position: [-2.5, 0, 0], size: [1.5, 2, 1.5], color: 0x4a5a6a, rotY: Math.PI / 2 },
      { type: 'equipment', position: [2.5, 0, 0], size: [1.5, 2, 1.5], color: 0x4a5a6a, rotY: -Math.PI / 2 },
      // Pipes along ceiling
      { type: 'pipe', position: [0, 2.4, 0], size: [8, 0.15, 0.15], color: 0x5566aa },
      { type: 'pipe', position: [0, 2.2, 1.5], size: [8, 0.12, 0.12], color: 0x5566aa },
      // Temperature gauges (small wall items)
      { type: 'panel', position: [-3.8, 1.2, 0], size: [0.1, 0.6, 0.4], color: 0x444455 },
      // Cooling valve wheel (interactable)
      { type: 'valve', position: [0, 0, 2], size: [0.8, 0.8, 0.4], color: 0x334455, id: 'cooling_console', rotY: Math.PI },
      // Grated floor
      { type: 'grate', position: [0, 0.01, 0], size: [6, 0.02, 4], color: 0x333344 },
    ],
  }),

  // ===================================================================
  // 27. GENERATOR
  // Origin: (58,0,-21), Size: 8x3x6
  // Walls: N z=-24, S z=-18, E x=62, W x=54
  // ===================================================================
  room('GENERATOR', {
    origin: [58, 0, -21],
    size: [8, 3, 6],
    wallColor: 0x3a3a2a,
    floorColor: 0x222218,
    lightColor: 0xffaa55,
    lightIntensity: 0.6,
    doors: [
      { wall: 'west', offset: 0, width: 2, height: 2.5 },    // from SERVER_ROOM
      { wall: 'east', offset: 0, width: 2, height: 2.5 },    // to REACTOR_CORE
    ],
    triggers: [
      { id: 'generator_enter', position: [-2, 1, 0], size: [3, 3, 4] },
      { id: 'generator_core', position: [2, 1, 0], size: [3, 3, 2] },
    ],
    props: [
      // Main generator unit
      { type: 'generator', position: [0, 0, -1.5], size: [3, 2, 2], color: 0x444433 },
      // Exhaust pipes (ceiling-mounted)
      { type: 'pipe', position: [-2, 2.6, -1.5], size: [0.15, 0.15, 3], color: 0x555544 },
      { type: 'pipe', position: [2, 2.6, -1.5], size: [0.15, 0.15, 3], color: 0x555544 },
      // Control panel (mounted on north wall, away from west/east doors)
      { type: 'panel', position: [0, 0.5, -2.85], size: [1.5, 1.5, 0.15], color: 0x555555 },
      // Fuel drums
      { type: 'drum', position: [3, 0, 1.5], size: [0.5, 0.8, 0.5], color: 0x884422 },
      { type: 'drum', position: [3.5, 0, 1.8], size: [0.5, 0.8, 0.5], color: 0x884422 },
      // Warning light (small red box)
      { type: 'warning_light', position: [0, 2.5, -2.8], size: [0.2, 0.2, 0.2], color: 0xff2222 },
      // Grated floor section
      { type: 'grate', position: [0, 0.01, 0.5], size: [4, 0.02, 2], color: 0x333333 },
    ],
  }),

  // ===================================================================
  // 28. REACTOR_CORE  (NEW)
  // Origin: (66,0,-21), Size: 8x3x8
  // Walls: N z=-25, S z=-17, E x=70, W x=62
  // ===================================================================
  room('REACTOR_CORE', {
    origin: [66, 0, -21],
    size: [8, 3, 8],
    wallColor: 0x4a2a1a,
    floorColor: 0x2a1a10,
    ceilingColor: 0x3a2a1a,
    lightColor: 0xff6633,
    lightIntensity: 0.7,
    fogColor: 0x1a0a05,
    doors: [
      { wall: 'west', offset: 0, width: 2, height: 2.5 },    // from GENERATOR
    ],
    triggers: [
      { id: 'reactor_enter', position: [-2, 1, 0], size: [3, 3, 6] },
      { id: 'reactor_core_inspect', position: [2, 1, 0], size: [3, 3, 6] },
    ],
    props: [
      // Central reactor vessel
      { type: 'tank', position: [0, 0, 0], size: [2, 2.5, 2], color: 0x3a3a3a },
      // Warning stripes
      { type: 'stripe', position: [0, 0.01, 0], size: [7, 0.02, 7], color: 0xaa4400 },
      // Radiation warning signs
      { type: 'warning_light', position: [0, 2.5, -3.8], size: [0.25, 0.25, 0.25], color: 0xff3300 },
      { type: 'warning_light', position: [0, 2.5, 3.8], size: [0.25, 0.25, 0.25], color: 0xff3300 },
      // Control console
      { type: 'desk', position: [-2.5, 0, -2.5], size: [1.2, 0.75, 0.6], color: 0x333333 },
      { type: 'monitor', position: [-2.5, 0.75, -2.5], size: [0.5, 0.55, 0.3], color: 0x221100 },
      // Coolant pipes (ceiling-mounted)
      { type: 'pipe', position: [3, 2.3, 0], size: [0.2, 0.2, 8], color: 0x664422 },
      { type: 'pipe', position: [-3, 2.3, 0], size: [0.2, 0.2, 8], color: 0x664422 },
    ],
  }),

  // ===================================================================
  // 29. CORRIDOR_DEF_3
  // Origin: (48,0,-33), Size: 4x3x14, noLight
  // Walls: N z=-40, S z=-26, E x=50, W x=46
  // ===================================================================
  room('CORRIDOR_DEF_3', {
    origin: [48, 0, -33],
    size: [4, 3, 14],
    wallColor: 0x1a1a28,
    floorColor: 0x111118,
    ceilingColor: 0x181820,
    lightIntensity: 0.6,
    doors: [
      { wall: 'south', offset: 0, width: 2, height: 2.5 },   // from SERVER_ROOM
      { wall: 'north', offset: 0, width: 2, height: 2.5 },   // to DATA_CENTER
    ],
    triggers: [
      { id: 'corridor_def3_enter', position: [0, 1, 5], size: [4, 3, 4] },
      { id: 'corridor_def3_mid', position: [0, 1, -3], size: [4, 3, 4] },
    ],
    props: [
      { type: 'light_fixture', position: [0, 2.8, 4], size: [0.3, 0.05, 0.3], color: 0x4466cc },
      { type: 'light_fixture', position: [0, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0x4466cc },
      { type: 'light_fixture', position: [0, 2.8, -4], size: [0.3, 0.05, 0.3], color: 0x4466cc },
    ],
  }),

  // ===================================================================
  // 30. DATA_CENTER  (enlarged from 10x4x8 to 12x4x10)
  // Origin: (48,0,-45), Size: 12x4x10
  // Walls: N z=-50, S z=-40, E x=54, W x=42
  // ===================================================================
  room('DATA_CENTER', {
    origin: [48, 0, -45],
    size: [12, 4, 10],
    wallColor: 0x1a1a2a,
    floorColor: 0x111118,
    lightColor: 0x4466ff,
    lightIntensity: 0.6,
    fogColor: 0x050510,
    doors: [
      { wall: 'south', offset: 0, width: 2, height: 2.5 },   // from CORRIDOR_DEF_3
      { wall: 'north', offset: 0, width: 2, height: 2.5 },   // to CORRIDOR_DEF_4
      { wall: 'east', offset: 0, width: 2, height: 2.5 },    // to DEEP_STORAGE
      { wall: 'west', offset: 0, width: 2, height: 2.5 },    // to MONITORING_STATION
    ],
    triggers: [
      { id: 'data_center_enter', position: [0, 1, 3], size: [8, 4, 3] },
      { id: 'data_center_screens', position: [0, 1, -2], size: [6, 4, 3] },
    ],
    props: [
      // Server racks - left row (front faces center aisle +X)
      { type: 'rack', position: [-4.5, 0, -3.5], size: [1, 3, 0.6], color: 0x0a0a1a, rotY: Math.PI / 2 },
      { type: 'rack', position: [-4.5, 0, -1.5], size: [1, 3, 0.6], color: 0x0a0a1a, rotY: Math.PI / 2 },
      { type: 'rack', position: [-4.5, 0, 1.5], size: [1, 3, 0.6], color: 0x0a0a1a, rotY: Math.PI / 2 },
      { type: 'rack', position: [-4.5, 0, 3.5], size: [1, 3, 0.6], color: 0x0a0a1a, rotY: Math.PI / 2 },
      // Server racks - right row (front faces center aisle -X)
      { type: 'rack', position: [4.5, 0, -3.5], size: [1, 3, 0.6], color: 0x0a0a1a, rotY: -Math.PI / 2 },
      { type: 'rack', position: [4.5, 0, -1.5], size: [1, 3, 0.6], color: 0x0a0a1a, rotY: -Math.PI / 2 },
      { type: 'rack', position: [4.5, 0, 1.5], size: [1, 3, 0.6], color: 0x0a0a1a, rotY: -Math.PI / 2 },
      { type: 'rack', position: [4.5, 0, 3.5], size: [1, 3, 0.6], color: 0x0a0a1a, rotY: -Math.PI / 2 },
      // Central monitoring station
      { type: 'desk', position: [0, 0, 0], size: [1.2, 0.75, 0.6], color: 0x222233 },
      { type: 'monitor', position: [0, 0.75, 0], size: [0.5, 0.55, 0.3], color: 0x111122 },
      // Floor cable trays
      { type: 'cable', position: [-2, 0.02, 0], size: [0.2, 0.04, 10], color: 0x1a1a2a },
      { type: 'cable', position: [2, 0.02, 0], size: [0.2, 0.04, 10], color: 0x1a1a2a },
      // Status lights (rotated with racks)
      { type: 'led', position: [-4.5, 2, -3.5], size: [0.02, 0.05, 0.6], color: 0x2244ff, rotY: Math.PI / 2 },
      { type: 'led', position: [4.5, 2, -3.5], size: [0.02, 0.05, 0.6], color: 0x2244ff, rotY: -Math.PI / 2 },
      { type: 'led', position: [-4.5, 2, 1.5], size: [0.02, 0.05, 0.6], color: 0x2244ff, rotY: Math.PI / 2 },
      { type: 'led', position: [4.5, 2, 1.5], size: [0.02, 0.05, 0.6], color: 0x2244ff, rotY: -Math.PI / 2 },
    ],
  }),

  // ===================================================================
  // 31. MONITORING_STATION  (NEW)
  // Origin: (37,0,-45), Size: 10x4x8
  // Walls: N z=-49, S z=-41, E x=42, W x=32
  // ===================================================================
  room('MONITORING_STATION', {
    origin: [37, 0, -45],
    size: [10, 4, 8],
    wallColor: 0x1a1a2a,
    floorColor: 0x0f0f18,
    ceilingColor: 0x181822,
    lightColor: 0x4466ff,
    lightIntensity: 0.55,
    fogColor: 0x050510,
    doors: [
      { wall: 'east', offset: 0, width: 2, height: 2.5 },    // from DATA_CENTER
    ],
    triggers: [
      { id: 'monitoring_enter', position: [3, 1, 0], size: [3, 4, 6] },
      { id: 'monitoring_screens', position: [-2, 1, 0], size: [4, 4, 6] },
    ],
    props: [
      // Wall of monitors (north wall)
      { type: 'monitor_wall', position: [0, 0.5, -3.8], size: [7, 2.5, 0.1], color: 0x111122 },
      // Operator desk + consoles on desk
      { type: 'desk', position: [0, 0, -1], size: [7, 0.75, 0.7], color: 0x222233 },
      { type: 'console', position: [-2, 0.75, -1], size: [1.2, 0.7, 0.5], color: 0x1a1a2a },
      { type: 'console', position: [0, 0.75, -1], size: [1.2, 0.7, 0.5], color: 0x1a1a2a },
      { type: 'console', position: [2, 0.75, -1], size: [1.2, 0.7, 0.5], color: 0x1a1a2a },
      // Operator chairs
      { type: 'chair', position: [-2, 0, 0.5], size: [0.5, 0.5, 0.5], color: 0x222222 },
      { type: 'chair', position: [0, 0, 0.5], size: [0.5, 0.5, 0.5], color: 0x222222 },
      { type: 'chair', position: [2, 0, 0.5], size: [0.5, 0.5, 0.5], color: 0x222222 },
      // Floor guide lights
      { type: 'led', position: [-3.5, 0.05, 0], size: [0.1, 0.02, 6], color: 0x2244aa },
      { type: 'led', position: [3.5, 0.05, 0], size: [0.1, 0.02, 6], color: 0x2244aa },
      // Lore: previous narrator maintenance log
      { type: 'document', position: [-2, 0.76, -1], size: [0.3, 0.02, 0.2], color: 0x886611, id: 'lore_previous_narrator' },
    ],
  }),

  // ===================================================================
  // 32. DEEP_STORAGE
  // Origin: (58,0,-45), Size: 8x4x8
  // Walls: N z=-49, S z=-41, E x=62, W x=54
  // ===================================================================
  room('DEEP_STORAGE', {
    origin: [58, 0, -45],
    size: [8, 4, 8],
    wallColor: 0x1a1a1a,
    floorColor: 0x0f0f0f,
    ceilingColor: 0x1a1a1a,
    lightColor: 0xcc4444,
    lightIntensity: 0.5,
    fogColor: 0x050505,
    doors: [
      { wall: 'west', offset: 0, width: 2, height: 2.5 },    // from DATA_CENTER
      { wall: 'east', offset: 0, width: 2, height: 2.5, eraMin: 5 },  // to SUBJECT_CHAMBER (era 5+)
    ],
    triggers: [
      { id: 'deep_storage_enter', position: [-2, 1, 0], size: [3, 4, 6] },
      { id: 'deep_storage_records', position: [2, 1, -2], size: [3, 4, 3] },
    ],
    props: [
      // Cryogenic-looking containers
      { type: 'cryo', position: [-2.5, 0, -2], size: [1, 2, 0.8], color: 0x1a2a2a },
      { type: 'cryo', position: [-2.5, 0, 0], size: [1, 2, 0.8], color: 0x1a2a2a },
      { type: 'cryo', position: [-2.5, 0, 2], size: [1, 2, 0.8], color: 0x1a2a2a },
      // Old experiment equipment
      { type: 'tank', position: [2.5, 0, -2], size: [1, 2.5, 1], color: 0x222222 },
      { type: 'tank', position: [2.5, 0, 1], size: [1, 2.5, 1], color: 0x222222 },
      // Central terminal with old records
      { type: 'desk', position: [0, 0, -3], size: [2, 0.75, 0.6], color: 0x222222 },
      { type: 'monitor', position: [0, 0.75, -3], size: [0.6, 0.55, 0.35], color: 0x0a0a0a },
      // Dust/debris
      { type: 'debris', position: [1, 0, 2.5], size: [0.5, 0.1, 0.5], color: 0x333333 },
      { type: 'debris', position: [-1, 0, 3], size: [0.3, 0.08, 0.4], color: 0x333333 },
      // Red warning light
      { type: 'warning_light', position: [0, 3.2, 0], size: [0.25, 0.25, 0.25], color: 0xff1111 },
      // Lore: final report fragment
      { type: 'document', position: [0, 0.76, -2.5], size: [0.3, 0.02, 0.2], color: 0x886611, id: 'lore_final_report' },
    ],
  }),

  // ===================================================================
  // 33. CORRIDOR_DEF_4
  // Origin: (48,0,-57), Size: 4x3x14, noLight
  // Walls: N z=-64, S z=-50, E x=50, W x=46
  // ===================================================================
  room('CORRIDOR_DEF_4', {
    origin: [48, 0, -57],
    size: [4, 3, 14],
    wallColor: 0x0f0f1a,
    floorColor: 0x0a0a10,
    ceilingColor: 0x121218,
    lightIntensity: 0.85,
    doors: [
      { wall: 'south', offset: 0, width: 2, height: 2.5 },   // from DATA_CENTER
      { wall: 'north', offset: 0, width: 2, height: 2.5 },   // to CONTROL_ROOM
    ],
    triggers: [
      { id: 'corridor_def4_enter', position: [0, 1, 5], size: [4, 3, 4] },
      { id: 'corridor_def4_mid', position: [0, 1, -3], size: [4, 3, 4] },
    ],
    props: [
      { type: 'light_fixture', position: [0, 2.8, 4], size: [0.3, 0.05, 0.3], color: 0x3355cc },
      { type: 'light_fixture', position: [0, 2.8, 0], size: [0.3, 0.05, 0.3], color: 0x3355cc },
      { type: 'light_fixture', position: [0, 2.8, -4], size: [0.3, 0.05, 0.3], color: 0x3355cc },
    ],
  }),

  // ===================================================================
  // 34. CONTROL_ROOM  (enlarged from 12x4x10 to 14x4x12)
  // Origin: (48,0,-70), Size: 14x4x12
  // Walls: N z=-76, S z=-64, E x=55, W x=41
  // ===================================================================
  room('CONTROL_ROOM', {
    origin: [48, 0, -70],
    size: [14, 4, 12],
    wallColor: 0x0f0f1f,
    floorColor: 0x0a0a12,
    lightColor: 0x3355ff,
    lightIntensity: 0.85,
    fogColor: 0x030308,
    doors: [
      { wall: 'south', offset: 0, width: 2, height: 2.5 },
    ],
    triggers: [
      { id: 'control_room_enter', position: [0, 1, 3], size: [8, 4, 4] },
      { id: 'control_room_approach', position: [0, 1, -1], size: [8, 4, 4] },
      { id: 'truth_ending', position: [0, 1, -4], size: [6, 4, 3] },
    ],
    props: [
      // Large curved monitor wall
      { type: 'monitor_wall', position: [0, 0.5, -5.5], size: [10, 2.5, 0.1], color: 0x111122 },
      // Side monitors
      { type: 'monitor_wall', position: [-6.5, 0.5, -2], size: [0.1, 2, 4], color: 0x111122 },
      { type: 'monitor_wall', position: [6.5, 0.5, -2], size: [0.1, 2, 4], color: 0x111122 },
      // Operator desk row + consoles on desks
      { type: 'desk', position: [-3, 0, -2], size: [4, 0.75, 0.7], color: 0x222233 },
      { type: 'desk', position: [3, 0, -2], size: [4, 0.75, 0.7], color: 0x222233 },
      { type: 'console', position: [-4, 0.75, -2], size: [1.2, 0.7, 0.5], color: 0x1a1a2a },
      { type: 'console', position: [-2, 0.75, -2], size: [1.2, 0.7, 0.5], color: 0x1a1a2a },
      { type: 'console', position: [2, 0.75, -2], size: [1.2, 0.7, 0.5], color: 0x1a1a2a },
      { type: 'console', position: [4, 0.75, -2], size: [1.2, 0.7, 0.5], color: 0x1a1a2a },
      // Floor lights (guide path)
      { type: 'floor_light', position: [-1, 0.01, 4], size: [0.1, 0.02, 0.1], color: 0x3355ff },
      { type: 'floor_light', position: [1, 0.01, 4], size: [0.1, 0.02, 0.1], color: 0x3355ff },
      { type: 'floor_light', position: [-1, 0.01, 2], size: [0.1, 0.02, 0.1], color: 0x3355ff },
      { type: 'floor_light', position: [1, 0.01, 2], size: [0.1, 0.02, 0.1], color: 0x3355ff },
      { type: 'floor_light', position: [-1, 0.01, 0], size: [0.1, 0.02, 0.1], color: 0x3355ff },
      { type: 'floor_light', position: [1, 0.01, 0], size: [0.1, 0.02, 0.1], color: 0x3355ff },
    ],
  }),

  // ===================================================================
  // 35. SUBJECT_CHAMBER  (NEW — era 5+ only)
  // Origin: (65,0,-45), Size: 6x3x6
  // Walls: N z=-48, S z=-42, E x=68, W x=62
  // Connected to DEEP_STORAGE east wall (x=62 shared)
  // ===================================================================
  room('SUBJECT_CHAMBER', {
    origin: [65, 0, -45],
    size: [6, 3, 6],
    wallColor: 0x1a1a1a,
    floorColor: 0x0f0f0f,
    ceilingColor: 0x1a1a1a,
    lightColor: 0xcc6644,
    lightIntensity: 0.45,
    fogColor: 0x050505,
    eraMin: 5,
    doors: [
      { wall: 'west', offset: 0, width: 2, height: 2.5 },    // from DEEP_STORAGE
    ],
    triggers: [
      { id: 'subject_chamber_enter', position: [-1, 1, 0], size: [3, 3, 4] },
      { id: 'subject_chamber_inspect', position: [1, 1, -1], size: [3, 3, 3] },
    ],
    props: [
      // Makeshift cot
      { type: 'bench', position: [1.5, 0, -2], size: [1.5, 0.3, 0.7], color: 0x444433 },
      // Old blanket on cot
      { type: 'debris', position: [1.5, 0.3, -2], size: [1.3, 0.05, 0.6], color: 0x555544 },
      // Makeshift desk + old lore document
      { type: 'desk', position: [-2, 0, -2], size: [0.8, 0.5, 0.5], color: 0x333322 },
      { type: 'document', position: [-2, 0.51, -2], size: [0.3, 0.02, 0.2], color: 0x886611, id: 'lore_subject_7490' },
      // Old monitor on desk
      { type: 'monitor', position: [-2, 0.5, -2.3], size: [0.4, 0.45, 0.25], color: 0x222211 },
      // Scratched tally marks on wall (decorative)
      { type: 'debris', position: [2.8, 1.2, 0], size: [0.05, 0.8, 1.5], color: 0x333322 },
      // Food containers (debris)
      { type: 'debris', position: [0, 0, 1.5], size: [0.3, 0.1, 0.3], color: 0x444433 },
      { type: 'debris', position: [0.5, 0, 2], size: [0.2, 0.08, 0.2], color: 0x444433 },
    ],
  }),

  // LOOP_CORRIDOR is not a physical room.
  // Loop behavior is handled by triggers inside HALLWAY_1 (loop_back)
  // and teleportation. When the player goes backward, they are teleported
  // back to the hallway entrance, creating the illusion of a loop.
];

// Map from room ID to room data for quick lookup
export const ROOM_MAP = {};
for (const r of ROOMS) {
  ROOM_MAP[r.id] = r;
}

// Door connections: which rooms connect via doors
export const CONNECTIONS = [
  // Main spine
  { from: 'START_ROOM', wall: 'north', to: 'HALLWAY_1', toWall: 'south' },

  // Compliance path
  { from: 'HALLWAY_1', wall: 'west', to: 'CORRIDOR_COMP_1', toWall: 'east' },
  { from: 'CORRIDOR_COMP_1', wall: 'west', to: 'OFFICE_WING', toWall: 'east' },
  { from: 'OFFICE_WING', wall: 'south', to: 'BREAK_ROOM', toWall: 'north' },
  { from: 'OFFICE_WING', wall: 'west', to: 'CORRIDOR_COMP_2', toWall: 'east' },
  { from: 'CORRIDOR_COMP_2', wall: 'west', to: 'CONFERENCE', toWall: 'east' },
  { from: 'CONFERENCE', wall: 'south', to: 'OBSERVATION_DECK', toWall: 'north' },
  { from: 'CONFERENCE', wall: 'west', to: 'ARCHIVE', toWall: 'east' },
  { from: 'CONFERENCE', wall: 'north', to: 'CORRIDOR_COMP_3', toWall: 'south' },
  { from: 'CORRIDOR_COMP_3', wall: 'east', to: 'RECORDS_ROOM', toWall: 'west' },
  { from: 'CORRIDOR_COMP_3', wall: 'north', to: 'UPPER_OFFICE', toWall: 'south' },
  { from: 'ARCHIVE', wall: 'west', to: 'FORGOTTEN_WING', toWall: 'east' },
  { from: 'ARCHIVE', wall: 'north', to: 'EXPERIMENT_LAB', toWall: 'south' },
  { from: 'UPPER_OFFICE', wall: 'east', to: 'DIRECTOR_SUITE', toWall: 'west' },
  { from: 'UPPER_OFFICE', wall: 'north', to: 'CORRIDOR_COMP_4', toWall: 'south' },
  { from: 'CORRIDOR_COMP_4', wall: 'north', to: 'GARDEN_ANTECHAMBER', toWall: 'south' },
  { from: 'GARDEN_ANTECHAMBER', wall: 'north', to: 'FALSE_ENDING_ROOM', toWall: 'south' },

  // Defiance path
  { from: 'HALLWAY_1', wall: 'east', to: 'CORRIDOR_DEF_1', toWall: 'west' },
  { from: 'CORRIDOR_DEF_1', wall: 'east', to: 'MAINTENANCE', toWall: 'west' },
  { from: 'MAINTENANCE', wall: 'south', to: 'VENTILATION_SHAFT', toWall: 'north' },
  { from: 'MAINTENANCE', wall: 'north', to: 'SECURITY_CHECKPOINT', toWall: 'south' },
  { from: 'MAINTENANCE', wall: 'east', to: 'CORRIDOR_DEF_2', toWall: 'west' },
  { from: 'SECURITY_CHECKPOINT', wall: 'north', to: 'HOLDING_CELLS', toWall: 'south' },
  { from: 'CORRIDOR_DEF_2', wall: 'east', to: 'SERVER_ROOM', toWall: 'west' },
  { from: 'SERVER_ROOM', wall: 'south', to: 'COOLING_ROOM', toWall: 'north' },
  { from: 'SERVER_ROOM', wall: 'east', to: 'GENERATOR', toWall: 'west' },
  { from: 'SERVER_ROOM', wall: 'north', to: 'CORRIDOR_DEF_3', toWall: 'south' },
  { from: 'GENERATOR', wall: 'east', to: 'REACTOR_CORE', toWall: 'west' },
  { from: 'CORRIDOR_DEF_3', wall: 'north', to: 'DATA_CENTER', toWall: 'south' },
  { from: 'DATA_CENTER', wall: 'west', to: 'MONITORING_STATION', toWall: 'east' },
  { from: 'DATA_CENTER', wall: 'east', to: 'DEEP_STORAGE', toWall: 'west' },
  { from: 'DATA_CENTER', wall: 'north', to: 'CORRIDOR_DEF_4', toWall: 'south' },
  { from: 'CORRIDOR_DEF_4', wall: 'north', to: 'CONTROL_ROOM', toWall: 'south' },

  // Era-conditional connections
  { from: 'DEEP_STORAGE', wall: 'east', to: 'SUBJECT_CHAMBER', toWall: 'west', eraMin: 5 },
];

// Player start position
export const PLAYER_START = { position: [0, 1.6, 0], rotation: [0, 0, 0] };
