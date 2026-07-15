/**
 * A generic, Map-based registry. This is the project's answer to "no switch
 * statements": every polymorphic lookup (skills, strategies, profiles) is a
 * key -> value resolution here. Entries are REGISTERED at bootstrap and
 * resolved dynamically at runtime, so adding behaviour never edits a consumer.
 */
export class Registry<V> {
  private readonly label: string;
  private readonly entries: Map<string, V>;

  constructor(label: string) {
    this.label = label;
    this.entries = new Map<string, V>();
  }

  /** Register a new entry. Throws if the key is already taken. */
  register(key: string, value: V): this {
    if (this.entries.has(key)) {
      throw new Error(`${this.label}: "${key}" is already registered.`);
    }
    this.entries.set(key, value);
    return this;
  }

  /** Register or replace an entry (useful for overrides and tests). */
  set(key: string, value: V): this {
    this.entries.set(key, value);
    return this;
  }

  /** Resolve an entry, or throw a descriptive error listing what IS registered. */
  get(key: string): V {
    const value = this.entries.get(key);
    if (value === undefined) {
      const known = this.keys().join(", ") || "<none>";
      throw new Error(
        `${this.label}: nothing registered for "${key}". Registered keys: [${known}].`,
      );
    }
    return value;
  }

  /** Resolve an entry, or return undefined. */
  tryGet(key: string): V | undefined {
    return this.entries.get(key);
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  keys(): string[] {
    return [...this.entries.keys()];
  }

  get size(): number {
    return this.entries.size;
  }
}
