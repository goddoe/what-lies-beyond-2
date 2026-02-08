/**
 * Cross-playthrough memory — persists between game restarts via localStorage.
 *
 * Tracks endings seen, defiance/compliance totals, secrets found,
 * and computes the current "era" (1-5) which drives script variations.
 */
export class PlaythroughMemory {
  constructor() {
    this.storageKey = 'wlb2_memory';
    this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const d = JSON.parse(raw);
        this.playthroughCount = d.playthroughCount || 0;
        this.endingsSeen = new Set(d.endingsSeen || []);
        this.lastEnding = d.lastEnding || null;
        this.totalDefiance = d.totalDefiance || 0;
        this.totalCompliance = d.totalCompliance || 0;
        this.secretsFound = new Set(d.secretsFound || []);
        this.narratorRevealed = d.narratorRevealed || false;
        this.fastestClear = d.fastestClear || Infinity;
        return;
      }
    } catch (_) { /* ignore corrupt data */ }

    // Fresh state
    this.playthroughCount = 0;
    this.endingsSeen = new Set();
    this.lastEnding = null;
    this.totalDefiance = 0;
    this.totalCompliance = 0;
    this.secretsFound = new Set();
    this.narratorRevealed = false;
    this.fastestClear = Infinity;
  }

  save() {
    const d = {
      playthroughCount: this.playthroughCount,
      endingsSeen: [...this.endingsSeen],
      lastEnding: this.lastEnding,
      totalDefiance: this.totalDefiance,
      totalCompliance: this.totalCompliance,
      secretsFound: [...this.secretsFound],
      narratorRevealed: this.narratorRevealed,
      fastestClear: this.fastestClear === Infinity ? 0 : this.fastestClear,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(d));
  }

  reset() {
    localStorage.removeItem(this.storageKey);
    this._load();
  }

  /**
   * Call at the end of each playthrough.
   * @param {string} endingType - e.g. 'false_happy', 'truth', etc.
   * @param {number} playTimeSeconds - play duration in seconds
   * @param {number} defiance - defiance count this run
   * @param {number} compliance - compliance count this run
   */
  recordEnding(endingType, playTimeSeconds = 0, defiance = 0, compliance = 0) {
    this.playthroughCount++;
    this.endingsSeen.add(endingType);
    this.lastEnding = endingType;
    this.totalDefiance += defiance;
    this.totalCompliance += compliance;
    if (playTimeSeconds > 0 && playTimeSeconds < this.fastestClear) {
      this.fastestClear = playTimeSeconds;
    }
    this.save();
  }

  markNarratorRevealed() {
    this.narratorRevealed = true;
    this.save();
  }

  findSecret(secretId) {
    this.secretsFound.add(secretId);
    this.save();
  }

  /**
   * Compute the current era (1-5).
   *
   * Era 1: First playthrough
   * Era 2: 2-3 playthroughs OR narrator revealed
   * Era 3: 4-6 playthroughs
   * Era 4: 7-9 playthroughs
   * Era 5: 10+ playthroughs OR all 7 original endings seen
   */
  getEra() {
    const count = this.playthroughCount;
    const allOriginalEndings = ['false_happy', 'truth', 'rebellion', 'loop', 'meta', 'compassion', 'silence'];
    const seenAll = allOriginalEndings.every(e => this.endingsSeen.has(e));

    if (seenAll || count >= 10) return 5;
    if (count >= 7) return 4;
    if (count >= 4) return 3;
    if (count >= 2 || this.narratorRevealed) return 2;
    return 1;
  }

  /**
   * Player profile based on cumulative behavior.
   * @returns {'obedient'|'rebel'|'explorer'|'balanced'}
   */
  getPlayerProfile() {
    const total = this.totalDefiance + this.totalCompliance;
    if (total === 0) return 'balanced';
    const defianceRate = this.totalDefiance / total;
    if (defianceRate >= 0.7) return 'rebel';
    if (defianceRate <= 0.3) return 'obedient';
    if (this.secretsFound.size >= 3) return 'explorer';
    return 'balanced';
  }

  /** True if this is the very first playthrough. */
  get isFirstPlay() {
    return this.playthroughCount === 0;
  }
}
