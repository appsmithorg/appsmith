import { MongoClient } from "mongodb";
import { createClient, type RedisClientType } from "redis";
import { MongoRedisGovernanceStore } from "./store.js";

// Integration test for the REAL Mongo+Redis governance store (locks, one-time confirmations, audit records). It is
// skipped unless both APPSMITH_MONGODB_URI and APPSMITH_REDIS_URL are set, so the standard unit run (no databases in
// CI) stays green; run it locally against Docker:
//   APPSMITH_MONGODB_URI=mongodb://127.0.0.1:27017 APPSMITH_REDIS_URL=redis://127.0.0.1:6379 \
//     corepack yarn workspace appsmith-mcp test:unit src/governance/store.integration.test.ts
const mongoUrl =
  process.env.APPSMITH_MONGODB_URI ?? process.env.APPSMITH_DB_URL;
const redisUrl = process.env.APPSMITH_REDIS_URL;
const describeIf = mongoUrl && redisUrl ? describe : describe.skip;
const TEST_DB = "appsmith_mcp_integration_test";

// Anti-silent-no-op guard: the CI integration step sets MCP_REQUIRE_INTEGRATION=1. In that job the suite MUST run, so
// if the mongo/redis wiring ever drifts (renamed service, dropped env) this fails LOUDLY instead of the whole suite
// reverting to describe.skip and the step still exiting 0 green. In the normal (unset) unit run this block is inert.
if (process.env.MCP_REQUIRE_INTEGRATION === "1") {
  describe("governance integration prerequisites", () => {
    it("has Mongo and Redis configured (CI must not silently skip the safety-net suite)", () => {
      expect(mongoUrl).toBeTruthy();
      expect(redisUrl).toBeTruthy();
    });
  });
}

describeIf("MongoRedisGovernanceStore (real Mongo + Redis)", () => {
  let mongo: MongoClient;
  let redis: RedisClientType;
  let store: MongoRedisGovernanceStore;

  beforeAll(async () => {
    mongo = new MongoClient(mongoUrl as string);
    redis = createClient({ url: redisUrl });
    store = new MongoRedisGovernanceStore(mongo, redis, TEST_DB);
    await store.connect();
    // Clean slate for the audit collection.
    await mongo.db(TEST_DB).collection("mcp_changes").deleteMany({});
  });

  afterAll(async () => {
    await mongo
      .db(TEST_DB)
      .dropDatabase()
      .catch(() => {});
    await store.close();
  });

  // Unique per run so parallel/re-runs never collide on Redis keys.
  const suffix = process.pid.toString(36);

  it("acquires an exclusive lock, blocks a second holder, and releases it", async () => {
    const key = `it-lock-${suffix}-a`;
    const first = await store.acquireLock(key, 5_000);
    const second = await store.acquireLock(key, 5_000);

    expect(first).toBeTruthy();
    expect(second).toBeUndefined(); // NX: already held

    await store.releaseLock(key, first as string);

    const third = await store.acquireLock(key, 5_000);

    expect(third).toBeTruthy(); // released -> acquirable again
    await store.releaseLock(key, third as string);
  });

  it("does NOT release a lock when the lockId does not match (safe Lua release)", async () => {
    const key = `it-lock-${suffix}-b`;
    const held = await store.acquireLock(key, 5_000);

    await store.releaseLock(key, "someone-elses-lock-id");

    // Still held: a mismatched releaser cannot free another holder's lock.
    expect(await store.acquireLock(key, 5_000)).toBeUndefined();
    await store.releaseLock(key, held as string);
  });

  it("stores and consumes a one-time confirmation exactly once", async () => {
    const confirmation = {
      id: `it-confirm-${suffix}`,
      actorId: "user@appsmith.com",
      entityKey: "page:app:pg",
      operation: "delete_page",
      revision: "r1",
      digest: "d1",
      expiresAt: new Date(Date.now() + 60_000),
    };

    await store.createConfirmation(confirmation, 60_000);

    const consumed = await store.consumeConfirmation(confirmation.id);

    expect(consumed?.id).toBe(confirmation.id);
    expect(consumed?.operation).toBe("delete_page");

    // One-time: a second consume finds nothing.
    expect(await store.consumeConfirmation(confirmation.id)).toBeUndefined();
  });

  it("persists audit changes and reads them back by actor (scoped + ordered)", async () => {
    const actor = `actor-${suffix}`;
    const base = {
      actorId: actor,
      entityKey: "page:app:pg",
      operation: "edit_page",
      revisionBefore: "r1",
      revisionAfter: "r2",
      rollback: { kind: "layout" },
      summary: { notes: ["added button"] },
    };

    await store.saveChange({
      ...base,
      id: `chg-${suffix}-1`,
      createdAt: new Date(1),
    });
    await store.saveChange({
      ...base,
      id: `chg-${suffix}-2`,
      createdAt: new Date(2),
    });

    const fetched = await store.getChange(`chg-${suffix}-1`, actor);

    expect(fetched?.operation).toBe("edit_page");

    // Actor scoping: another user cannot read this change.
    expect(
      await store.getChange(`chg-${suffix}-1`, "other-actor"),
    ).toBeUndefined();

    // listChanges returns this actor's records, newest first.
    const listed = await store.listChanges(actor, 10);
    const ids = listed.map((change) => change.id);

    expect(ids).toContain(`chg-${suffix}-1`);
    expect(ids).toContain(`chg-${suffix}-2`);
    expect(ids.indexOf(`chg-${suffix}-2`)).toBeLessThan(
      ids.indexOf(`chg-${suffix}-1`),
    ); // createdAt desc
  });
});
