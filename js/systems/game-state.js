/**
 * Central game state machine + event bus.
 *
 * States: MENU → PLAYING → PAUSED → ENDING
 */

export const State = {
  MENU: 'MENU',
  CLICK_TO_PLAY: 'CLICK_TO_PLAY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  ENDING: 'ENDING',
  CCTV: 'CCTV',
  TERMINAL: 'TERMINAL',
};

export class GameState {
  constructor() {
    this.current = State.MENU;
    this.previous = null;
    this.listeners = new Map();

    // Game-wide state
    this.currentRoom = 'START_ROOM';
    this.visitedRooms = new Set();
    this.loopCount = 0;
    this.decisionsMade = new Set(); // track which decision triggers have been handled
    this.idlePromptCount = 0;

    // Silence ending: track total idle time (no movement)
    this.totalIdleTime = 0;       // seconds of no movement
    this.silenceTriggered = false;

    // Playthrough timer
    this.playStartTime = 0;
    this.totalPlayTime = 0;
  }

  /**
   * Transition to a new state.
   */
  set(newState) {
    if (newState === this.current) return;
    this.previous = this.current;
    this.current = newState;

    if (newState === State.PLAYING && !this.playStartTime) {
      this.playStartTime = Date.now();
    }

    this.emit('stateChange', { from: this.previous, to: newState });
  }

  /**
   * Check if in a specific state.
   */
  is(state) {
    return this.current === state;
  }

  /**
   * Register an event listener.
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Emit an event.
   */
  emit(event, data = {}) {
    const cbs = this.listeners.get(event);
    if (cbs) {
      for (const cb of cbs) cb(data);
    }
  }

  /**
   * Record visiting a room.
   */
  enterRoom(roomId) {
    const wasNew = !this.visitedRooms.has(roomId);
    this.visitedRooms.add(roomId);
    this.currentRoom = roomId;

    if (roomId === 'LOOP_CORRIDOR') {
      this.loopCount++;
    }

    this.emit('roomEnter', { roomId, firstVisit: wasNew });
    return wasNew;
  }

  /**
   * Mark a decision as handled.
   */
  markDecision(decisionId) {
    this.decisionsMade.add(decisionId);
  }

  /**
   * Check if a decision has been made.
   */
  hasDecision(decisionId) {
    return this.decisionsMade.has(decisionId);
  }

  /**
   * Clear a specific decision (for loop resets).
   */
  clearDecision(decisionId) {
    this.decisionsMade.delete(decisionId);
  }

  /**
   * Update idle time tracker. Returns true if silence ending should fire.
   */
  updateIdleTime(delta, isMoving) {
    if (isMoving) {
      this.totalIdleTime = 0;
    } else {
      this.totalIdleTime += delta;
    }
    // Silence ending: 1 minute (60 seconds) of total stillness
    return !this.silenceTriggered && this.totalIdleTime >= 60;
  }

  /**
   * Get elapsed play time in seconds.
   */
  getPlayTime() {
    if (!this.playStartTime) return 0;
    return (Date.now() - this.playStartTime) / 1000;
  }

  /**
   * Reset for new game.
   */
  reset() {
    this.current = State.MENU;
    this.previous = null;
    this.currentRoom = 'START_ROOM';
    this.visitedRooms.clear();
    this.loopCount = 0;
    this.decisionsMade.clear();
    this.idlePromptCount = 0;
    this.totalIdleTime = 0;
    this.silenceTriggered = false;
    this.playStartTime = 0;
    this.totalPlayTime = 0;
  }
}
