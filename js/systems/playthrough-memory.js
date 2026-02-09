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
        this.lastVariant = d.lastVariant || null;
        this.cctvComplianceSeen = d.cctvComplianceSeen || false;
        this.cctvDefianceSeen = d.cctvDefianceSeen || false;
        this.era8Completed = d.era8Completed || false;
        this.era9Completed = d.era9Completed || false;
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
    this.lastVariant = null;
    this.cctvComplianceSeen = false;
    this.cctvDefianceSeen = false;
    this.era8Completed = false;
    this.era9Completed = false;
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
      lastVariant: this.lastVariant,
      cctvComplianceSeen: this.cctvComplianceSeen,
      cctvDefianceSeen: this.cctvDefianceSeen,
      era8Completed: this.era8Completed,
      era9Completed: this.era9Completed,
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
   * Compute the current era (1-10).
   *
   * Era 1:  First playthrough (inner voice)
   * Era 2:  2+ playthroughs OR narrator revealed (dialogue mode)
   * Era 3:  3+ playthroughs (self-aware, philosophical)
   * Era 4:  5+ playthroughs (fatigue, cynicism, run variants)
   * Era 5:  7+ playthroughs OR all 7 original endings (honest, SUBJECT_CHAMBER)
   * Era 6:  8+ playthroughs OR 8+ endings seen (CCTV compliance path)
   * Era 7:  9+ playthroughs OR cctvComplianceSeen (CCTV defiance path)
   * Era 8:  10+ playthroughs OR cctvDefianceSeen (hybrid mode 1)
   * Era 9:  12+ playthroughs OR era8Completed (hybrid mode 2, heavy glitch)
   * Era 10: 14+ playthroughs OR era9Completed (terminal ending)
   */
  getEra() {
    const count = this.playthroughCount;
    const allOriginalEndings = ['false_happy', 'truth', 'rebellion', 'loop', 'meta', 'compassion', 'silence'];
    const seenAll = allOriginalEndings.every(e => this.endingsSeen.has(e));

    if (count >= 14 || this.era9Completed) return 10;
    if (count >= 12 || this.era8Completed) return 9;
    if (count >= 10 || this.cctvDefianceSeen) return 8;
    if (count >= 9 || this.cctvComplianceSeen) return 7;
    if (count >= 8 || this.endingsSeen.size >= 8) return 6;
    if (seenAll || count >= 7) return 5;
    if (count >= 5) return 4;
    if (count >= 3) return 3;
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
