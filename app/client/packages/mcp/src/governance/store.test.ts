import { createGovernanceStoreFromEnv } from "./store.js";

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
});
