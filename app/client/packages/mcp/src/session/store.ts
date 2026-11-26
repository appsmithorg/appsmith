import { createHash, timingSafeEqual } from "node:crypto";
import { SESSION_TTL_CEILING_MS } from "../gates.js";

// Multi-replica session state. Every Appsmith pod runs its own MCP process, and the SDK transport that owns a
// session's open streams can only live in ONE process. What CAN be shared is the session RECORD: who owns it (token
// hash + user), the tenant/admin facts captured at initialize, and the client's initialize params so any pod can
// rebuild an equivalent server + transport on first sight (see hydrateSession in app.ts). The record store is the
// source of truth for existence, expiry, and the caps; each pod keeps a local cache of live transports on top.

// The client's initialize params, replayed verbatim on a foreign pod so the rebuilt SDK server learns the same
// client capabilities (elicitation detection) through the SDK's own initialize path.
export interface McpSessionInitializeParams {
  protocolVersion: string;
  capabilities: Record<string, unknown>;
  clientInfo: Record<string, unknown>;
}

export interface McpSessionRecord {
  id: string;
  // sha256 hex of the bearer that opened the session. The raw token is NEVER persisted: every request carries its
  // own bearer, so the record only needs to bind the session to it.
  tokenHash: string;
  username: string;
  organizationId: string;
  isAdmin: boolean;
  requestOrigin?: string;
  initialize: McpSessionInitializeParams;
  // Absolute epoch millis at the time of the last write. For the Redis store the key's own TTL is authoritative
  // (see RedisSessionStore.touch); the field is kept for the in-memory store and for diagnostics.
  expiresAt: number;
}

export interface McpSessionSummary {
  id: string;
  username: string;
  expiresAt: number;
}

export interface McpSessionStore {
  // Undefined when unknown OR expired.
  get(id: string): Promise<McpSessionRecord | undefined>;
  put(record: McpSessionRecord): Promise<void>;
  // Refreshes the idle TTL of a session that still exists. Returns false when the record is already gone (expired,
  // evicted, or DELETEd — possibly by another pod between this request's read and now), so the caller answers 404
  // instead of resurrecting it for another TTL.
  touch(record: McpSessionRecord, expiresAt: number): Promise<boolean>;
  delete(id: string): Promise<void>;
  // Live (unexpired) sessions across every pod.
  countAll(): Promise<number>;
  // Live sessions owned by one user IN ONE TENANT, for the per-user cap and its least-recently-active eviction.
  // Scoped by organization because on a multi-org (EE) instance the same email can exist in two tenants, and one
  // must never be able to evict the other's sessions.
  listByUser(
    username: string,
    organizationId: string,
  ): Promise<McpSessionSummary[]>;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Both sides are fixed-length hex digests, so the comparison is constant-time and length-safe.
export function tokenHashesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  return (
    leftBuffer.byteLength === rightBuffer.byteLength &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

// Single-process store: the default, and exactly the behaviour the server had before records became shareable.
export class InMemorySessionStore implements McpSessionStore {
  private readonly records = new Map<string, McpSessionRecord>();

  constructor(private readonly now: () => number = Date.now) {}

  private live(record: McpSessionRecord | undefined) {
    if (record === undefined) return undefined;

    if (record.expiresAt <= this.now()) {
      this.records.delete(record.id);

      return undefined;
    }

    return record;
  }

  async get(id: string): Promise<McpSessionRecord | undefined> {
    return this.live(this.records.get(id));
  }

  async put(record: McpSessionRecord): Promise<void> {
    this.records.set(record.id, { ...record });
  }

  async touch(record: McpSessionRecord, expiresAt: number): Promise<boolean> {
    const existing = this.live(this.records.get(record.id));

    if (existing === undefined) return false;

    existing.expiresAt = expiresAt;

    return true;
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }

  async countAll(): Promise<number> {
    let count = 0;

    for (const record of [...this.records.values()]) {
      if (this.live(record)) count += 1;
    }

    return count;
  }

  async listByUser(
    username: string,
    organizationId: string,
  ): Promise<McpSessionSummary[]> {
    const summaries: McpSessionSummary[] = [];

    for (const record of [...this.records.values()]) {
      if (
        record.username === username &&
        record.organizationId === organizationId &&
        this.live(record)
      ) {
        summaries.push({
          id: record.id,
          username: record.username,
          expiresAt: record.expiresAt,
        });
      }
    }

    return summaries;
  }
}

// The subset of node-redis (standalone or cluster) the session store calls. Every command is single-key so a
// redis-cluster:// deployment needs no hash tags.
export interface SessionRedis {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options: { PX: number }): Promise<unknown>;
  // Resolves truthy (true / 1) when the key existed and its TTL was set; falsy when the key is gone.
  pExpire(key: string, ms: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
  zAdd(key: string, member: { score: number; value: string }): Promise<unknown>;
  zRem(key: string, member: string): Promise<unknown>;
  zCard(key: string): Promise<number>;
  zRemRangeByScore(
    key: string,
    min: number | string,
    max: number | string,
  ): Promise<unknown>;
  zRangeWithScores(
    key: string,
    min: number,
    max: number,
  ): Promise<Array<{ value: string; score: number }>>;
}

const SESSION_PREFIX = "appsmith:mcp:session:";
const ALL_SESSIONS_KEY = "appsmith:mcp:sessions:all";
const USER_SESSIONS_PREFIX = "appsmith:mcp:sessions:user:";

// TTL of the cap indexes, refreshed on every write. Fixed at the session-TTL ceiling rather than the writing
// session's own TTL so an index can never expire before its longest-lived member (a session's TTL is clamped to
// this ceiling, and every member write refreshes the index), while still guaranteeing that an index nobody
// prunes again — a user who never returns, a rollback to memory mode — disappears on its own.
export const SESSION_INDEX_TTL_MS = SESSION_TTL_CEILING_MS;

function userSessionsKey(organizationId: string, username: string): string {
  // Hashed so a username (an email) never appears in a Redis key, and so the key stays a single token. The tenant
  // is part of the hash input: see McpSessionStore.listByUser.
  return `${USER_SESSIONS_PREFIX}${createHash("sha256")
    .update(`${organizationId}:${username}`)
    .digest("hex")}`;
}

function isSessionRecord(value: unknown): value is McpSessionRecord {
  if (typeof value !== "object" || value === null) return false;

  const record = value as Record<string, unknown>;
  const initialize = record.initialize as Record<string, unknown> | undefined;

  return (
    typeof record.id === "string" &&
    typeof record.tokenHash === "string" &&
    typeof record.username === "string" &&
    typeof record.organizationId === "string" &&
    typeof record.isAdmin === "boolean" &&
    typeof record.expiresAt === "number" &&
    typeof initialize === "object" &&
    initialize !== null &&
    typeof initialize.protocolVersion === "string" &&
    typeof initialize.capabilities === "object" &&
    initialize.capabilities !== null &&
    typeof initialize.clientInfo === "object" &&
    initialize.clientInfo !== null
  );
}

// Redis-backed record store shared by every replica. The record lives at a key whose TTL IS the idle TTL: every
// touch is a PEXPIRE, never a rewrite, so a record another pod just deleted can't be resurrected. Two sorted sets
// scored by expiresAt index it for the instance-wide and per-user caps; they are pruned by score on every read
// and expire SESSION_INDEX_TTL_MS after their last write, so no key in this family lives forever.
export class RedisSessionStore implements McpSessionStore {
  constructor(
    private readonly redis: SessionRedis,
    private readonly now: () => number = Date.now,
  ) {}

  async get(id: string): Promise<McpSessionRecord | undefined> {
    const value = await this.redis.get(`${SESSION_PREFIX}${id}`);

    if (typeof value !== "string") return undefined;

    let parsed: unknown;

    try {
      parsed = JSON.parse(value);
    } catch {
      return undefined;
    }

    // Fail closed on any record this build cannot fully trust: a malformed or older-shaped record reads as
    // missing (404 -> the client re-initializes) rather than being served with guessed fields.
    return isSessionRecord(parsed) ? parsed : undefined;
  }

  private async index(
    record: McpSessionRecord,
    expiresAt: number,
  ): Promise<void> {
    const member = { score: expiresAt, value: record.id };
    const userKey = userSessionsKey(record.organizationId, record.username);

    await this.redis.zAdd(ALL_SESSIONS_KEY, member);
    await this.redis.pExpire(ALL_SESSIONS_KEY, SESSION_INDEX_TTL_MS);
    await this.redis.zAdd(userKey, member);
    await this.redis.pExpire(userKey, SESSION_INDEX_TTL_MS);
  }

  async put(record: McpSessionRecord): Promise<void> {
    const ttlMs = record.expiresAt - this.now();

    if (ttlMs <= 0) return;

    await this.redis.set(
      `${SESSION_PREFIX}${record.id}`,
      JSON.stringify(record),
      { PX: ttlMs },
    );
    await this.index(record, record.expiresAt);
  }

  async touch(record: McpSessionRecord, expiresAt: number): Promise<boolean> {
    const ttlMs = expiresAt - this.now();

    if (ttlMs <= 0) return false;

    const alive = await this.redis.pExpire(
      `${SESSION_PREFIX}${record.id}`,
      ttlMs,
    );

    if (!alive) return false;

    await this.index(record, expiresAt);

    return true;
  }

  async delete(id: string): Promise<void> {
    const record = await this.get(id);

    await this.redis.del(`${SESSION_PREFIX}${id}`);
    await this.redis.zRem(ALL_SESSIONS_KEY, id);

    if (record !== undefined) {
      await this.redis.zRem(
        userSessionsKey(record.organizationId, record.username),
        id,
      );
    }
  }

  async countAll(): Promise<number> {
    await this.redis.zRemRangeByScore(ALL_SESSIONS_KEY, "-inf", this.now());

    return this.redis.zCard(ALL_SESSIONS_KEY);
  }

  async listByUser(
    username: string,
    organizationId: string,
  ): Promise<McpSessionSummary[]> {
    const key = userSessionsKey(organizationId, username);

    await this.redis.zRemRangeByScore(key, "-inf", this.now());

    const members = await this.redis.zRangeWithScores(key, 0, -1);

    return members.map((member) => ({
      id: member.value,
      username,
      expiresAt: member.score,
    }));
  }
}
