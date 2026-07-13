import { randomUUID } from "node:crypto";
import { MongoClient, type Collection } from "mongodb";
import { createClient, type RedisClientType } from "redis";

export interface McpChangeRecord {
  id: string;
  actorId: string;
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
  saveChange(change: McpChangeRecord): Promise<void>;
  getChange(id: string, actorId: string): Promise<McpChangeRecord | undefined>;
  listChanges(actorId: string, limit: number): Promise<McpChangeRecord[]>;
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
    await this.changes.createIndex({ actorId: 1, createdAt: -1 });
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

  async saveChange(change: McpChangeRecord): Promise<void> {
    await this.changes.insertOne(change);
  }

  async getChange(
    id: string,
    actorId: string,
  ): Promise<McpChangeRecord | undefined> {
    return (await this.changes.findOne({ id, actorId })) ?? undefined;
  }

  async listChanges(
    actorId: string,
    limit: number,
  ): Promise<McpChangeRecord[]> {
    return this.changes
      .find({ actorId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }
}

export function createGovernanceStoreFromEnv():
  | MongoRedisGovernanceStore
  | undefined {
  const mongoUrl =
    process.env.APPSMITH_MONGODB_URI ?? process.env.APPSMITH_DB_URL;
  const redisUrl = process.env.APPSMITH_REDIS_URL;

  if (!mongoUrl || !redisUrl) return undefined;

  return new MongoRedisGovernanceStore(
    new MongoClient(mongoUrl),
    createClient({ url: redisUrl }),
  );
}
