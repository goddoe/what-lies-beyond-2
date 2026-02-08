/**
 * Tracks player compliance/defiance decisions.
 * Provides data for narrator variant selection and ending conditions.
 */
export class DecisionTracker {
  constructor() {
    this.reset();
  }

  reset() {
    this.decisions = [];         // { instruction, choice, complied }
    this.totalCompliance = 0;
    this.totalDefiance = 0;
    this.defianceStreak = 0;     // consecutive defiance count
    this.complianceStreak = 0;
    this.maxDefianceStreak = 0;

    // Phase 3+ expansions
    this.exploredOptional = new Set();  // optional rooms visited
    this.puzzlesCompleted = new Set();  // puzzles solved
    this.loreFound = new Set();         // lore documents discovered
    this.hesitations = 0;               // times player turned back / paused at decisions
  }

  /**
   * Record a decision.
   * @param {string} instruction - What the narrator told the player to do
   * @param {string} choice - What the player actually did
   * @param {boolean} complied - Whether the player followed the instruction
   */
  record(instruction, choice, complied) {
    this.decisions.push({
      instruction,
      choice,
      complied,
      timestamp: Date.now(),
    });

    if (complied) {
      this.totalCompliance++;
      this.complianceStreak++;
      this.defianceStreak = 0;
    } else {
      this.totalDefiance++;
      this.defianceStreak++;
      this.complianceStreak = 0;
      this.maxDefianceStreak = Math.max(this.maxDefianceStreak, this.defianceStreak);
    }
  }

  /**
   * Mark an optional room as explored.
   */
  exploreOptional(roomId) {
    this.exploredOptional.add(roomId);
  }

  /**
   * Mark a puzzle as completed.
   */
  completePuzzle(puzzleId) {
    this.puzzlesCompleted.add(puzzleId);
  }

  /**
   * Mark a lore document as found.
   */
  findLore(loreId) {
    this.loreFound.add(loreId);
  }

  /**
   * Calculate compliance rate (0-1).
   */
  get complianceRate() {
    const total = this.totalCompliance + this.totalDefiance;
    if (total === 0) return 1;
    return this.totalCompliance / total;
  }

  /**
   * Get total number of decisions made.
   */
  get totalDecisions() {
    return this.decisions.length;
  }

  /**
   * Determine which ending the player should get.
   * Returns: 'false_happy' | 'truth' | 'rebellion' | 'loop' | 'compassion' | null
   */
  getEndingType(currentRoom) {
    // Rebellion ending: 3+ consecutive defiance
    if (this.defianceStreak >= 3) {
      return 'rebellion';
    }

    // Loop ending: determined by loop count in game state
    // (handled externally via triggers)

    // False happy ending: reached the false ending room
    if (currentRoom === 'FALSE_ENDING_ROOM') {
      return 'false_happy';
    }

    // Truth ending: reached the control room
    if (currentRoom === 'CONTROL_ROOM') {
      return 'truth';
    }

    return null;
  }

  /**
   * Get formatted stats for ending displays.
   */
  getStats() {
    return {
      totalDecisions: this.totalDecisions,
      complianceRate: Math.round(this.complianceRate * 100),
      totalCompliance: this.totalCompliance,
      totalDefiance: this.totalDefiance,
      maxDefianceStreak: this.maxDefianceStreak,
      optionalRooms: this.exploredOptional.size,
      puzzlesSolved: this.puzzlesCompleted.size,
      loreCollected: this.loreFound.size,
      hesitations: this.hesitations,
      decisions: this.decisions.map(d => ({
        instruction: d.instruction,
        choice: d.choice,
        complied: d.complied,
      })),
    };
  }
}
