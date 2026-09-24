import type { MongoClient } from "mongodb";
import {
  createGovernanceStoreFromEnv,
  createRedisClientFromUrl,
  MongoRedisGovernanceStore,
  type PreparedConfirmation,
} from "./store.js";

describe("MongoRedisGovernanceStore confirmation reads", () => {
  // The Mongo side is never touched by the confirmation reads; the constructor only resolves the collection.
  const mongo = {
    db: () => ({ collection: () => ({}) }),
  } as unknown as MongoClient;
  const stored: PreparedConfirmation = {
    id: "conf-1",
    actorId: "user-1",
    entityKey: "application:app1",
    operation: "commit",
    revision: "rev-1",
    digest: "digest-1",
    expiresAt: new Date("2026-09-24T12:00:00.000Z"),
    context: { branch: "mcp/fix-1", message: "Fix orders" },
  };

  function storeWith(value: string | null) {
    const redis = {
      connect: async () => undefined,
      close: async () => undefined,
      set: async () => "OK",
      get: async () => value,
      eval: async () => value,
    };

    return new MongoRedisGovernanceStore(mongo, redis as never);
  }

  it("revives expiresAt as a Date and carries the context through the JSON round trip", async () => {
    const store = storeWith(JSON.stringify(stored));

    for (const read of [
      await store.peekConfirmation("conf-1"),
      await store.consumeConfirmation("conf-1"),
    ]) {
      expect(read?.expiresAt).toBeInstanceOf(Date);
      expect(read?.expiresAt.getTime()).toBe(stored.expiresAt.getTime());
      expect(read?.context).toEqual(stored.context);
      expect(read?.actorId).toBe("user-1");
    }
  });

  it("reads a missing or malformed confirmation as absent", async () => {
    expect(await storeWith(null).peekConfirmation("conf-1")).toBeUndefined();
    expect(await storeWith("{oops").peekConfirmation("conf-1")).toBeUndefined();
    expect(
      await storeWith(JSON.stringify({ id: 1 })).peekConfirmation("conf-1"),
    ).toBeUndefined();
  });
});

interface RedisClusterTestOptions {
  rootNodes: Array<{ url?: string }>;
  defaults?: {
    username?: string;
    password?: string;
    socket?: { tls?: boolean };
  };
}

function clusterOptions(redisUrl: string): RedisClusterTestOptions {
  const client = createRedisClientFromUrl(redisUrl) as unknown as {
    _options: RedisClusterTestOptions;
  };

  return client._options;
}

describe("createRedisClientFromUrl", () => {
  it("propagates ACL credentials and TLS to every cluster node", () => {
    expect(
      clusterOptions(
        "redis-cluster://appsmith:p%40ssword@clustercfg.example.cache.amazonaws.com:6379",
      ),
    ).toMatchObject({
      rootNodes: [
        {
          url: "rediss://clustercfg.example.cache.amazonaws.com:6379",
        },
      ],
      defaults: {
        username: "appsmith",
        password: "p@ssword",
        socket: { tls: true },
      },
    });
  });

  it("secures password-only cluster URLs without forcing an empty ACL username", () => {
    expect(
      clusterOptions(
        "redis-cluster://:secret@clustercfg.example.cache.amazonaws.com:6379",
      ),
    ).toMatchObject({
      rootNodes: [
        {
          url: "rediss://clustercfg.example.cache.amazonaws.com:6379",
        },
      ],
      defaults: {
        password: "secret",
        socket: { tls: true },
      },
    });
  });

  it("rejects cluster credentials that cannot be safely parsed", () => {
    expect(
      createRedisClientFromUrl(
        "redis-cluster://appsmith:%ZZ@clustercfg.example.cache.amazonaws.com:6379",
      ),
    ).toBeUndefined();
  });
});

// Unit coverage for the env-driven governance-store factory. MongoClient/redis clients do not open a connection at
// construction time, so these assertions never touch the network — they only exercise the URL-scheme fail-safe.
describe("createGovernanceStoreFromEnv", () => {
  const ENV_KEYS = [
    "APPSMITH_MONGODB_URI",
    "APPSMITH_DB_URL",
    "APPSMITH_REDIS_URL",
  ] as const;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it("returns undefined when the mongo/redis env vars are absent", () => {
    expect(createGovernanceStoreFromEnv()).toBeUndefined();
  });

  it("skips governance (does not throw) when the DB URL is not a Mongo URL", () => {
    // APPSMITH_DB_URL points at Postgres on some deployments; handing that to MongoClient would throw at startup.
    process.env.APPSMITH_DB_URL =
      "postgresql://user:pass@localhost:5432/appsmith";
    process.env.APPSMITH_REDIS_URL = "redis://127.0.0.1:6379";

    expect(() => createGovernanceStoreFromEnv()).not.toThrow();
    expect(createGovernanceStoreFromEnv()).toBeUndefined();
  });

  it("prefers APPSMITH_DB_URL over APPSMITH_MONGODB_URI when both are set", () => {
    // A leftover docker.env Mongo URI must not override the product DB URL (Java/RTS order).
    process.env.APPSMITH_DB_URL =
      "postgresql://user:pass@localhost:5432/appsmith";
    process.env.APPSMITH_MONGODB_URI = "mongodb://127.0.0.1:27017/appsmith";
    process.env.APPSMITH_REDIS_URL = "redis://127.0.0.1:6379";

    expect(createGovernanceStoreFromEnv()).toBeUndefined();
  });

  it("builds a store when the DB URL is a MongoDB URL", () => {
    process.env.APPSMITH_MONGODB_URI = "mongodb://127.0.0.1:27017/appsmith";
    process.env.APPSMITH_REDIS_URL = "redis://127.0.0.1:6379";

    expect(createGovernanceStoreFromEnv()).toBeDefined();
  });

  it("accepts a mongodb+srv URL", () => {
    process.env.APPSMITH_MONGODB_URI =
      "mongodb+srv://user:pass@cluster.example.net/appsmith";
    process.env.APPSMITH_REDIS_URL = "redis://127.0.0.1:6379";

    expect(createGovernanceStoreFromEnv()).toBeDefined();
  });

  it("builds a store for a redis-cluster URL instead of throwing Invalid protocol", () => {
    // Cloud / ElastiCache cluster mode uses redis-cluster://, which Java RedisConfig rewrites. node-redis
    // createClient rejects that scheme with TypeError("Invalid protocol") and used to crash MCP startup.
    process.env.APPSMITH_MONGODB_URI = "mongodb://127.0.0.1:27017/appsmith";
    process.env.APPSMITH_REDIS_URL =
      "redis-cluster://:secret@clustercfg.example.cache.amazonaws.com:6379";

    expect(() => createGovernanceStoreFromEnv()).not.toThrow();
    expect(createGovernanceStoreFromEnv()).toBeDefined();
  });

  it("builds a store for a rediss URL", () => {
    process.env.APPSMITH_MONGODB_URI = "mongodb://127.0.0.1:27017/appsmith";
    process.env.APPSMITH_REDIS_URL = "rediss://:secret@127.0.0.1:6379";

    expect(createGovernanceStoreFromEnv()).toBeDefined();
  });

  it("skips governance (does not throw) when the Redis URL scheme is unsupported", () => {
    process.env.APPSMITH_MONGODB_URI = "mongodb://127.0.0.1:27017/appsmith";
    process.env.APPSMITH_REDIS_URL = "http://127.0.0.1:6379";

    expect(() => createGovernanceStoreFromEnv()).not.toThrow();
    expect(createGovernanceStoreFromEnv()).toBeUndefined();
  });
});
