/**
 * Audio cache manager for TTS audio.
 * Keys: `${lineId}_${lang}`
 * Stores AudioBuffer or Blob references for reuse.
 */
export class AudioCache {
  constructor() {
    this.cache = new Map();
    this.audioContext = null;
  }

  _getContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Generate a cache key.
   */
  key(lineId, lang = 'ko') {
    return `${lineId}_${lang}`;
  }

  /**
   * Check if audio is cached.
   */
  has(lineId, lang = 'ko') {
    return this.cache.has(this.key(lineId, lang));
  }

  /**
   * Store audio data (ArrayBuffer or AudioBuffer).
   */
  async store(lineId, lang, arrayBuffer) {
    const ctx = this._getContext();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    this.cache.set(this.key(lineId, lang), audioBuffer);
    return audioBuffer;
  }

  /**
   * Retrieve cached AudioBuffer.
   */
  get(lineId, lang = 'ko') {
    return this.cache.get(this.key(lineId, lang));
  }

  /**
   * Play a cached audio buffer. Returns a promise that resolves when done.
   */
  play(lineId, lang = 'ko') {
    const buffer = this.get(lineId, lang);
    if (!buffer) return Promise.resolve();

    const ctx = this._getContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);

    return new Promise(resolve => {
      source.onended = resolve;
    });
  }

  /**
   * Clear all cached audio.
   */
  clear() {
    this.cache.clear();
  }
}
