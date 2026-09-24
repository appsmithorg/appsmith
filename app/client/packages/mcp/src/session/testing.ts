import type { RelayRedis, RelaySubscriber } from "./relay.js";
import type { SessionRedis } from "./store.js";

// In-process stand-in for the node-redis subset the session store and relay call. One FakeRedisServer is shared by
// every "pod" in a test; each FakeRedisClient is a connection to it (duplicate() opens another). Key expiry honours
// the injected clock so TTL behaviour is testable without waiting. Test-only: never bundled (server.ts is the only
// esbuild entry point and nothing under src/ imports this file).

interface StoredValue {
  value: string;
  expiresAt?: number;
}

export class FakeRedisServer {
  readonly strings = new Map<string, StoredValue>();
  readonly zsets = new Map<string, Map<string, number>>();
  readonly subscribers = new Map<
    string,
    Set<(message: string, channel: string) => void>
  >();
  // Every PUBLISH, for assertions on what crossed the wire.
  readonly published: Array<{ channel: string; message: string }> = [];

  constructor(public now: () => number = Date.now) {}

  private liveString(key: string): StoredValue | undefined {
    const stored = this.strings.get(key);

    if (!stored) return undefined;

    if (stored.expiresAt !== undefined && stored.expiresAt <= this.now()) {
      this.strings.delete(key);

      return undefined;
    }

    return stored;
  }

  client(): FakeRedisClient {
    return new FakeRedisClient(this);
  }

  // --- string commands ---
  get(key: string): string | null {
    return this.liveString(key)?.value ?? null;
  }

  set(key: string, value: string, options?: { PX?: number }): string {
    this.strings.set(key, {
      value,
      expiresAt:
        options?.PX !== undefined ? this.now() + options.PX : undefined,
    });

    return "OK";
  }

  del(key: string): number {
    const existed = this.strings.delete(key) || this.zsets.delete(key);

    return existed ? 1 : 0;
  }

  // Keys expire lazily on the next read (strings) or on the next access (sorted sets), like the clock-driven
  // string expiry above. Returns true only when the key existed.
  readonly zsetExpiry = new Map<string, number>();

  pExpire(key: string, ms: number): boolean {
    const stored = this.liveString(key);

    if (stored) {
      stored.expiresAt = this.now() + ms;

      return true;
    }

    if (this.liveZset(key)) {
      this.zsetExpiry.set(key, this.now() + ms);

      return true;
    }

    return false;
  }

  private liveZset(key: string): Map<string, number> | undefined {
    const expiresAt = this.zsetExpiry.get(key);

    if (expiresAt !== undefined && expiresAt <= this.now()) {
      this.zsets.delete(key);
      this.zsetExpiry.delete(key);

      return undefined;
    }

    return this.zsets.get(key);
  }

  // --- sorted-set commands ---
  private zset(key: string): Map<string, number> {
    let set = this.liveZset(key);

    if (!set) {
      set = new Map();
      this.zsets.set(key, set);
      this.zsetExpiry.delete(key);
    }

    return set;
  }

  zAdd(key: string, member: { score: number; value: string }): number {
    const set = this.zset(key);
    const added = set.has(member.value) ? 0 : 1;

    set.set(member.value, member.score);

    return added;
  }

  zRem(key: string, member: string): number {
    return this.liveZset(key)?.delete(member) ? 1 : 0;
  }

  zCard(key: string): number {
    return this.liveZset(key)?.size ?? 0;
  }

  zRemRangeByScore(
    key: string,
    min: number | string,
    max: number | string,
  ): number {
    const set = this.liveZset(key);

    if (!set) return 0;

    const lower = min === "-inf" ? -Infinity : Number(min);
    const upper = max === "+inf" ? Infinity : Number(max);
    let removed = 0;

    for (const [value, score] of [...set.entries()]) {
      if (score >= lower && score <= upper) {
        set.delete(value);
        removed += 1;
      }
    }

    return removed;
  }

  zRangeWithScores(
    key: string,
    min: number,
    max: number,
  ): Array<{ value: string; score: number }> {
    const entries = [...(this.liveZset(key)?.entries() ?? [])]
      .map(([value, score]) => ({ value, score }))
      .sort((a, b) => a.score - b.score || a.value.localeCompare(b.value));
    const end = max < 0 ? entries.length + max + 1 : max + 1;

    return entries.slice(min, end);
  }

  // --- pub/sub ---
  publish(channel: string, message: string): number {
    this.published.push({ channel, message });

    const listeners = this.subscribers.get(channel);

    if (!listeners) return 0;

    // Asynchronous like a real socket: the publisher's await never runs the listener inline.
    for (const listener of listeners) {
      setImmediate(() => listener(message, channel));
    }

    return listeners.size;
  }

  subscribe(
    channel: string,
    listener: (message: string, channel: string) => void,
  ): void {
    let listeners = this.subscribers.get(channel);

    if (!listeners) {
      listeners = new Set();
      this.subscribers.set(channel, listeners);
    }

    listeners.add(listener);
  }

  unsubscribeAll(listener: (message: string, channel: string) => void): void {
    for (const listeners of this.subscribers.values()) {
      listeners.delete(listener);
    }
  }
}

export class FakeRedisClient
  implements SessionRedis, RelayRedis, RelaySubscriber
{
  private readonly listeners: Array<
    (message: string, channel: string) => void
  > = [];
  // `error` listeners attached through on(); tests raise a fake socket error with emitError().
  readonly errorListeners: Array<(error: Error) => void> = [];
  // Set by a test to make connect() reject (an unreachable Redis at startup).
  connectError: Error | undefined;

  constructor(private readonly server: FakeRedisServer) {}

  async connect(): Promise<void> {
    if (this.connectError) throw this.connectError;
  }

  on(event: "error", listener: (error: Error) => void): this {
    if (event === "error") this.errorListeners.push(listener);

    return this;
  }

  emitError(error: Error): void {
    for (const listener of this.errorListeners) listener(error);
  }

  async pExpire(key: string, ms: number): Promise<boolean> {
    return this.server.pExpire(key, ms);
  }

  async close(): Promise<void> {
    for (const listener of this.listeners) this.server.unsubscribeAll(listener);
  }

  duplicate(): FakeRedisClient {
    return new FakeRedisClient(this.server);
  }

  async get(key: string): Promise<string | null> {
    return this.server.get(key);
  }

  async set(
    key: string,
    value: string,
    options: { PX: number },
  ): Promise<string> {
    return this.server.set(key, value, options);
  }

  async del(key: string): Promise<number> {
    return this.server.del(key);
  }

  async zAdd(
    key: string,
    member: { score: number; value: string },
  ): Promise<number> {
    return this.server.zAdd(key, member);
  }

  async zRem(key: string, member: string): Promise<number> {
    return this.server.zRem(key, member);
  }

  async zCard(key: string): Promise<number> {
    return this.server.zCard(key);
  }

  async zRemRangeByScore(
    key: string,
    min: number | string,
    max: number | string,
  ): Promise<number> {
    return this.server.zRemRangeByScore(key, min, max);
  }

  async zRangeWithScores(
    key: string,
    min: number,
    max: number,
  ): Promise<Array<{ value: string; score: number }>> {
    return this.server.zRangeWithScores(key, min, max);
  }

  async publish(channel: string, message: string): Promise<number> {
    return this.server.publish(channel, message);
  }

  async subscribe(
    channel: string,
    listener: (message: string, channel: string) => void,
  ): Promise<void> {
    this.listeners.push(listener);
    this.server.subscribe(channel, listener);
  }
}
