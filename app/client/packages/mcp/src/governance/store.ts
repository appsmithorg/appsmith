import { randomUUID } from "node:crypto";
import { MongoClient, type Collection } from "mongodb";
import { createClient, type RedisClientType } from "redis";

export interface McpChangeRecord {
  id: string;
  actorId: string;
  // The caller's Appsmith organization (tenant). Every read is scoped to it so that on a multi-org (EE)
  // deployment one tenant's admin can never see another tenant's change history — actorId (email/username) is only
  // unique PER organization (Migration067_UpdateUserEmailIndex), so neither the admin nor the actor reads are safe
  // without this scope. Optional only so records written before this field existed deserialize; such records carry
  // no org and are therefore invisible to every org-scoped read (fail-closed).
  organizationId?: string;
  entityKey: string;
  operation: string;
  revisionBefore: string;
  revisionAfter: string;
  createdAt: Date;
  expiresAt?: Date;
  rollback: Record<string, unknown>;
  summary: Record<string, unknown>;
}

export interface PreparedConfirmation {
  id: string;
  actorId: string;
  entityKey: string;
  operation: string;
  revision: string;
  digest: string;
  expiresAt: Date;
}

export interface McpGovernanceStore {
  acquireLock(entityKey: string, ttlMs: number): Promise<string | undefined>;
  releaseLock(entityKey: string, lockId: string): Promise<void>;
  createConfirmation(
    confirmation: PreparedConfirmation,
    ttlMs: number,
  ): Promise<void>;
  consumeConfirmation(id: string): Promise<PreparedConfirmation | undefined>;
  // NON-consuming read of a prepared confirmation [SECURITY F1]: lets the elicitation layer verify a confirmation
  // exists and belongs to the calling actor BEFORE prompting the human, without spending the one-time token.
  peekConfirmation(id: string): Promise<PreparedConfirmation | undefined>;
  saveChange(change: McpChangeRecord): Promise<void>;
  // Every read is scoped to the caller's organization (tenant). getChange/listChanges are additionally actor-scoped
  // (a normal user sees only their own records); getAnyChange/listAllChanges are the admin cross-actor reads, gated
  // on isSuperUser at the tool layer. All four take organizationId because isSuperUser is a PER-ORG signal in EE
  // (MANAGE_ORGANIZATION on the caller's own org) and email/actorId is only per-org unique, so without the org
  // predicate one tenant's admin — or a colliding email — would read another tenant's history.
  getChange(
    id: string,
    actorId: string,
    organizationId: string,
  ): Promise<McpChangeRecord | undefined>;
  listChanges(
    actorId: string,
    organizationId: string,
    limit: number,
  ): Promise<McpChangeRecord[]>;
  getAnyChange(
    id: string,
    organizationId: string,
  ): Promise<McpChangeRecord | undefined>;
  listAllChanges(
    organizationId: string,
    limit: number,
  ): Promise<McpChangeRecord[]>;
}

const LOCK_PREFIX = "appsmith:mcp:lock:";
const CONFIRM_PREFIX = "appsmith:mcp:confirm:";
const RELEASE_LOCK_SCRIPT =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
const CONSUME_CONFIRMATION_SCRIPT =
  "local value = redis.call('get', KEYS[1]); if value then redis.call('del', KEYS[1]); end; return value";

// MCP owns these collections and keys. It never writes Appsmith product documents directly; it only records
// governance metadata around authorized REST mutations made by the MCP service.
export class MongoRedisGovernanceStore implements McpGovernanceStore {
  private readonly changes: Collection<McpChangeRecord>;

  constructor(
    private readonly mongo: MongoClient,
    private readonly redis: RedisClientType,
    databaseName = "appsmith",
  ) {
    this.changes = mongo
      .db(databaseName)
      .collection<McpChangeRecord>("mcp_changes");
  }

  async connect(): Promise<void> {
    await Promise.all([this.mongo.connect(), this.redis.connect()]);
    // Org-prefixed so every read's organizationId predicate is index-covered. The actor-scoped read
    // (listChanges) uses the first; the admin cross-actor read (listAllChanges: org predicate only, sort by
    // createdAt desc) uses the second.
    await this.changes.createIndex({
      organizationId: 1,
      actorId: 1,
      createdAt: -1,
    });
    await this.changes.createIndex({ organizationId: 1, createdAt: -1 });
    await this.changes.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  }

  async close(): Promise<void> {
    await Promise.allSettled([this.mongo.close(), this.redis.close()]);
  }

  async acquireLock(
    entityKey: string,
    ttlMs: number,
  ): Promise<string | undefined> {
    const lockId = randomUUID();
    const acquired = await this.redis.set(
      `${LOCK_PREFIX}${entityKey}`,
      lockId,
      {
        NX: true,
        PX: ttlMs,
      },
    );

    return acquired === "OK" ? lockId : undefined;
  }

  async releaseLock(entityKey: string, lockId: string): Promise<void> {
    await this.redis.eval(RELEASE_LOCK_SCRIPT, {
      keys: [`${LOCK_PREFIX}${entityKey}`],
      arguments: [lockId],
    });
  }

  async createConfirmation(
    confirmation: PreparedConfirmation,
    ttlMs: number,
  ): Promise<void> {
    const saved = await this.redis.set(
      `${CONFIRM_PREFIX}${confirmation.id}`,
      JSON.stringify(confirmation),
      { NX: true, PX: ttlMs },
    );

    if (saved !== "OK") {
      throw new Error("confirmation identifier collision");
    }
  }

  async consumeConfirmation(
    id: string,
  ): Promise<PreparedConfirmation | undefined> {
    const value = await this.redis.eval(CONSUME_CONFIRMATION_SCRIPT, {
      keys: [`${CONFIRM_PREFIX}${id}`],
      arguments: [],
    });

    if (typeof value !== "string") return undefined;

    return JSON.parse(value) as PreparedConfirmation;
  }

  async peekConfirmation(
    id: string,
  ): Promise<PreparedConfirmation | undefined> {
    // consumeConfirmation minus the delete: a plain GET, so the one-time token survives the read.
    const value = await this.redis.get(`${CONFIRM_PREFIX}${id}`);

    if (typeof value !== "string") return undefined;

    return JSON.parse(value) as PreparedConfirmation;
  }

  async saveChange(change: McpChangeRecord): Promise<void> {
    await this.changes.insertOne(change);
  }

  async getChange(
    id: string,
    actorId: string,
    organizationId: string,
  ): Promise<McpChangeRecord | undefined> {
    return (
      (await this.changes.findOne({ id, actorId, organizationId })) ?? undefined
    );
  }

  async listChanges(
    actorId: string,
    organizationId: string,
    limit: number,
  ): Promise<McpChangeRecord[]> {
    return this.changes
      .find({ actorId, organizationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  async getAnyChange(
    id: string,
    organizationId: string,
  ): Promise<McpChangeRecord | undefined> {
    // Cross-actor but STILL org-scoped: an admin's isSuperUser is only per-org in EE, so the org predicate is what
    // keeps one tenant's admin from reading another tenant's record.
    return (await this.changes.findOne({ id, organizationId })) ?? undefined;
  }

  async listAllChanges(
    organizationId: string,
    limit: number,
  ): Promise<McpChangeRecord[]> {
    // No actorId filter (cross-actor admin audit) but scoped to the caller's organization — records from other
    // tenants, and pre-scope records that carry no organizationId, never match.
    return this.changes
      .find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }
}

// Governance needs a MongoDB connection. On `release`, APPSMITH_DB_URL is the Mongo URL, but on deployments where it
// points at Postgres (or the value is otherwise not a Mongo URL) handing it to `new MongoClient` would throw at
// startup. Treat the URL as Mongo only when its scheme is mongodb:/mongodb+srv:; otherwise skip governance (the same
// fail-safe as when the env vars are absent) so the server still starts with governed tools simply unavailable.
function isMongoUrl(url: string): boolean {
  return /^mongodb(\+srv)?:\/\//i.test(url.trim());
}

export function createGovernanceStoreFromEnv():
  | MongoRedisGovernanceStore
  | undefined {
  const mongoUrl =
    process.env.APPSMITH_MONGODB_URI ?? process.env.APPSMITH_DB_URL;
  const redisUrl = process.env.APPSMITH_REDIS_URL;

  if (!mongoUrl || !redisUrl) return undefined;

  if (!isMongoUrl(mongoUrl)) {
    process.stderr.write(
      "Appsmith MCP governance disabled: the configured database URL is not a MongoDB URL " +
        "(expected mongodb:// or mongodb+srv://). Governed tools will be unavailable.\n",
    );

    return undefined;
  }

  return new MongoRedisGovernanceStore(
    new MongoClient(mongoUrl),
    createClient({ url: redisUrl }),
  );
}
