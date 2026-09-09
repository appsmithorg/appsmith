import { MongoClient } from "mongodb";
import { createClient, type RedisClientType } from "redis";
import { MongoRedisGovernanceStore } from "./store.js";

// Integration test for the REAL Mongo+Redis governance store (locks, one-time confirmations, audit records).
// Temporarily force-skipped (describe.skip) — re-enable by restoring `describeIf = mongoUrl && redisUrl ? describe : describe.skip`
// and the mcp-build.yml mongo/redis services + "Run governance integration tests" step.
// Local run when re-enabled:
//   APPSMITH_MONGODB_URI=mongodb://127.0.0.1:27017 APPSMITH_REDIS_URL=redis://127.0.0.1:6379 \
//     corepack yarn workspace appsmith-mcp test:unit src/governance/store.integration.test.ts
const mongoUrl =
  process.env.APPSMITH_MONGODB_URI ?? process.env.APPSMITH_DB_URL;
const redisUrl = process.env.APPSMITH_REDIS_URL;
// Temporarily disabled: do not hit live Mongo/Redis from the MCP unit/CI run.
const describeIf = describe.skip;
const TEST_DB = "appsmith_mcp_integration_test";

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

    // peekConfirmation is NON-consuming [security F1]: it reads the token without spending it.
    const peeked = await store.peekConfirmation(confirmation.id);

    expect(peeked?.id).toBe(confirmation.id);
    expect(peeked?.actorId).toBe("user@appsmith.com");

    const consumed = await store.consumeConfirmation(confirmation.id);

    expect(consumed?.id).toBe(confirmation.id);
    expect(consumed?.operation).toBe("delete_page");

    // One-time: a second consume finds nothing — and a peek after consumption finds nothing either.
    expect(await store.consumeConfirmation(confirmation.id)).toBeUndefined();
    expect(await store.peekConfirmation(confirmation.id)).toBeUndefined();
  });

  it("persists audit changes and reads them back by actor (scoped + ordered)", async () => {
    const actor = `actor-${suffix}`;
    const org = `org-${suffix}`;
    const base = {
      actorId: actor,
      organizationId: org,
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

    const fetched = await store.getChange(`chg-${suffix}-1`, actor, org);

    expect(fetched?.operation).toBe("edit_page");

    // Actor scoping: another user cannot read this change.
    expect(
      await store.getChange(`chg-${suffix}-1`, "other-actor", org),
    ).toBeUndefined();

    // listChanges returns this actor's records, newest first.
    const listed = await store.listChanges(actor, org, 10);
    const ids = listed.map((change) => change.id);

    expect(ids).toContain(`chg-${suffix}-1`);
    expect(ids).toContain(`chg-${suffix}-2`);
    expect(ids.indexOf(`chg-${suffix}-2`)).toBeLessThan(
      ids.indexOf(`chg-${suffix}-1`),
    ); // createdAt desc
  });

  // Regression for the Hacktron cross-tenant disclosure: on a multi-org (EE) instance every read MUST be scoped to
  // the caller's organization. On the unpatched store (no org predicate) tenant B's admin read returns tenant A's
  // records; on the fix it returns only its own. Same email in both orgs (per-org-unique) proves the actor read is
  // scoped too, not only the admin read.
  it("scopes every read to the caller's organization (no cross-tenant disclosure)", async () => {
    const sharedEmail = `admin-${suffix}@example.com`;
    const orgA = `orgA-${suffix}`;
    const orgB = `orgB-${suffix}`;
    const rec = (id: string, organizationId: string) => ({
      id,
      actorId: sharedEmail,
      organizationId,
      entityKey: "page:app:pg",
      operation: "edit_page",
      revisionBefore: "r1",
      revisionAfter: "r2",
      createdAt: new Date(),
      rollback: { kind: "layout" },
      summary: {},
    });

    await store.saveChange(rec(`iso-${suffix}-A`, orgA));
    await store.saveChange(rec(`iso-${suffix}-B`, orgB));

    // Admin cross-actor read from org A sees only org A's record.
    const adminA = (await store.listAllChanges(orgA, 100)).map((c) => c.id);

    expect(adminA).toContain(`iso-${suffix}-A`);
    expect(adminA).not.toContain(`iso-${suffix}-B`);

    // get_any_change from org A cannot fetch org B's record by id.
    expect(await store.getAnyChange(`iso-${suffix}-B`, orgA)).toBeUndefined();

    // Actor-scoped reads are org-scoped too: the same email in org A cannot see org B's record.
    const actorA = (await store.listChanges(sharedEmail, orgA, 100)).map(
      (c) => c.id,
    );

    expect(actorA).toContain(`iso-${suffix}-A`);
    expect(actorA).not.toContain(`iso-${suffix}-B`);
    expect(
      await store.getChange(`iso-${suffix}-B`, sharedEmail, orgA),
    ).toBeUndefined();
  });
});
