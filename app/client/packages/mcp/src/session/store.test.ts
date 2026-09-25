import {
  InMemorySessionStore,
  RedisSessionStore,
  SESSION_INDEX_TTL_MS,
  hashToken,
  tokenHashesMatch,
  type McpSessionRecord,
  type McpSessionStore,
} from "./store.js";
import { FakeRedisServer } from "./testing.js";

const USER = "user@appsmith.com";
const ORG = "org-1";

function record(
  overrides: Partial<McpSessionRecord> & { id: string; expiresAt: number },
): McpSessionRecord {
  return {
    tokenHash: hashToken("mcp_token"),
    username: USER,
    organizationId: ORG,
    isAdmin: false,
    initialize: {
      protocolVersion: "2025-11-25",
      capabilities: { elicitation: {} },
      clientInfo: { name: "test", version: "1.0.0" },
    },
    ...overrides,
  };
}

describe("token hashing", () => {
  it("hashes deterministically and compares hashes constant-time", () => {
    expect(hashToken("a")).toBe(hashToken("a"));
    expect(hashToken("a")).not.toBe(hashToken("b"));
    expect(tokenHashesMatch(hashToken("a"), hashToken("a"))).toBe(true);
    expect(tokenHashesMatch(hashToken("a"), hashToken("b"))).toBe(false);
    expect(tokenHashesMatch(hashToken("a"), "short")).toBe(false);
  });
});

// Both stores must honour one contract; the suite runs against each.
function storeContract(
  name: string,
  make: (now: () => number) => McpSessionStore,
) {
  describe(name, () => {
    let clock = 1_000_000;
    const now = () => clock;

    beforeEach(() => {
      clock = 1_000_000;
    });

    it("round-trips a record and hides it once expired", async () => {
      const store = make(now);

      await store.put(record({ id: "s1", expiresAt: clock + 1_000 }));
      expect((await store.get("s1"))?.username).toBe(USER);
      expect((await store.get("s1"))?.initialize.capabilities).toEqual({
        elicitation: {},
      });

      clock += 1_000;
      expect(await store.get("s1")).toBeUndefined();
      expect(await store.countAll()).toBe(0);
    });

    it("touch extends the idle TTL and reorders least-recently-active", async () => {
      const store = make(now);

      await store.put(record({ id: "old", expiresAt: clock + 1_000 }));
      await store.put(record({ id: "new", expiresAt: clock + 2_000 }));

      const old = (await store.get("old")) as McpSessionRecord;

      expect(await store.touch(old, clock + 5_000)).toBe(true);

      const byUser = await store.listByUser(USER, ORG);

      expect(byUser.map((s) => s.id).sort()).toEqual(["new", "old"]);
      expect(byUser.find((s) => s.id === "old")?.expiresAt).toBe(clock + 5_000);

      clock += 2_000;
      expect(await store.get("new")).toBeUndefined();
      expect(await store.get("old")).toBeDefined();
      expect((await store.listByUser(USER, ORG)).map((s) => s.id)).toEqual([
        "old",
      ]);
    });

    it("touch refuses to resurrect a session that is gone (deleted or expired elsewhere)", async () => {
      const store = make(now);
      const live = record({ id: "s1", expiresAt: clock + 1_000 });

      await store.put(live);
      await store.delete("s1");
      expect(await store.touch(live, clock + 5_000)).toBe(false);
      expect(await store.get("s1")).toBeUndefined();
      expect(await store.countAll()).toBe(0);

      await store.put(record({ id: "s2", expiresAt: clock + 10 }));
      clock += 10;
      expect(
        await store.touch(
          record({ id: "s2", expiresAt: clock + 10 }),
          clock + 5_000,
        ),
      ).toBe(false);
      expect(await store.get("s2")).toBeUndefined();
    });

    it("counts live sessions across users and lists per user within one tenant", async () => {
      const store = make(now);

      await store.put(record({ id: "a1", expiresAt: clock + 1_000 }));
      await store.put(
        record({
          id: "b1",
          username: "other@appsmith.com",
          expiresAt: clock + 1_000,
        }),
      );
      await store.put(record({ id: "a2", expiresAt: clock + 10 }));
      // Same email in ANOTHER tenant: never part of this user's cap.
      await store.put(
        record({ id: "t2", organizationId: "org-2", expiresAt: clock + 1_000 }),
      );

      expect(await store.countAll()).toBe(4);
      expect(
        (await store.listByUser(USER, ORG)).map((s) => s.id).sort(),
      ).toEqual(["a1", "a2"]);
      expect((await store.listByUser(USER, "org-2")).map((s) => s.id)).toEqual([
        "t2",
      ]);

      clock += 10;
      expect(await store.countAll()).toBe(3);
      expect((await store.listByUser(USER, ORG)).map((s) => s.id)).toEqual([
        "a1",
      ]);
    });

    it("delete removes the record and its cap bookkeeping", async () => {
      const store = make(now);

      await store.put(record({ id: "s1", expiresAt: clock + 1_000 }));
      await store.delete("s1");

      expect(await store.get("s1")).toBeUndefined();
      expect(await store.countAll()).toBe(0);
      expect(await store.listByUser(USER, ORG)).toEqual([]);
      // Deleting an unknown id is a no-op.
      await expect(store.delete("nope")).resolves.toBeUndefined();
    });
  });
}

storeContract("InMemorySessionStore", (now) => new InMemorySessionStore(now));
storeContract("RedisSessionStore", (now) => {
  const server = new FakeRedisServer(now);

  return new RedisSessionStore(server.client(), now);
});

describe("RedisSessionStore specifics", () => {
  it("is shared across clients of the same Redis (two pods see one record)", async () => {
    let clock = 5_000;
    const server = new FakeRedisServer(() => clock);
    const podA = new RedisSessionStore(server.client(), () => clock);
    const podB = new RedisSessionStore(server.client(), () => clock);

    await podA.put(record({ id: "s1", expiresAt: clock + 1_000 }));
    expect((await podB.get("s1"))?.id).toBe("s1");

    await podB.delete("s1");
    expect(await podA.get("s1")).toBeUndefined();
    clock += 1;
  });

  it("touch is a TTL refresh, never a rewrite, and the record key's TTL is authoritative", async () => {
    let clock = 5_000;
    const server = new FakeRedisServer(() => clock);
    const store = new RedisSessionStore(server.client(), () => clock);
    const live = record({ id: "s1", expiresAt: clock + 1_000 });

    await store.put(live);

    const before = server.get("appsmith:mcp:session:s1");

    expect(await store.touch(live, clock + 3_000)).toBe(true);
    // Same bytes: the body was not rewritten...
    expect(server.get("appsmith:mcp:session:s1")).toBe(before);
    // ...but the key now lives until the new deadline.
    clock += 2_000;
    expect((await store.get("s1"))?.id).toBe("s1");
    clock += 1_001;
    expect(await store.get("s1")).toBeUndefined();
  });

  it("every key in the family carries a TTL: the cap indexes expire with their freshest session", async () => {
    let clock = 5_000;
    const server = new FakeRedisServer(() => clock);
    const store = new RedisSessionStore(server.client(), () => clock);

    await store.put(record({ id: "s1", expiresAt: clock + 1_000 }));
    await store.put(record({ id: "s2", expiresAt: clock + 3_000 }));

    const userKeys = [...server.zsets.keys()].filter((key) =>
      key.startsWith("appsmith:mcp:sessions:user:"),
    );

    expect(userKeys).toHaveLength(1);
    expect(server.zsetExpiry.get("appsmith:mcp:sessions:all")).toBe(
      clock + SESSION_INDEX_TTL_MS,
    );
    expect(server.zsetExpiry.get(userKeys[0])).toBe(
      clock + SESSION_INDEX_TTL_MS,
    );

    // A later write with a SHORTER session TTL must not shorten the index below its longer-lived members.
    await store.put(record({ id: "s3", expiresAt: clock + 10 }));
    expect(server.zsetExpiry.get(userKeys[0])).toBe(
      clock + SESSION_INDEX_TTL_MS,
    );

    // Nobody ever prunes this user again: the index still disappears on its own once every member is long gone.
    clock += SESSION_INDEX_TTL_MS;
    expect(server.zCard(userKeys[0])).toBe(0);
    expect(server.zCard("appsmith:mcp:sessions:all")).toBe(0);
    expect(server.zsets.has(userKeys[0])).toBe(false);
  });

  it("never persists the raw token and rejects malformed or older-shaped records", async () => {
    const server = new FakeRedisServer();
    const store = new RedisSessionStore(server.client());

    await store.put(record({ id: "s1", expiresAt: Date.now() + 1_000 }));

    const raw = server.get("appsmith:mcp:session:s1") as string;

    expect(raw).not.toContain("mcp_token");
    expect(raw).toContain(hashToken("mcp_token"));

    server.set("appsmith:mcp:session:junk", "{not json", { PX: 1_000 });
    expect(await store.get("junk")).toBeUndefined();
    server.set("appsmith:mcp:session:shape", JSON.stringify({ id: 1 }), {
      PX: 1_000,
    });
    expect(await store.get("shape")).toBeUndefined();

    // Every field the server later trusts must be present and well-typed — an older-shaped record reads as
    // missing rather than being served with guessed admin/tenant facts.
    const withoutAdmin: Partial<McpSessionRecord> = record({
      id: "noadmin",
      expiresAt: Date.now() + 1_000,
    });

    delete withoutAdmin.isAdmin;

    server.set("appsmith:mcp:session:noadmin", JSON.stringify(withoutAdmin), {
      PX: 1_000,
    });
    expect(await store.get("noadmin")).toBeUndefined();
  });
});
