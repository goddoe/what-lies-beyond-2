/**
 * Minimal inventory system.
 * Tracks collected items (keycard, security code, etc.)
 */
export class Inventory {
  constructor() {
    this.items = new Set();
  }

  add(item) {
    this.items.add(item);
    return true;
  }

  has(item) {
    return this.items.has(item);
  }

  remove(item) {
    return this.items.delete(item);
  }

  reset() {
    this.items.clear();
  }
}
