import {
  NoopSessionRelay,
  RedisSessionRelay,
  generatePodId,
  isRelayableResponse,
  parseRelayedPayload,
  relayChannel,
  type McpSessionRelay,
  type RelayedPayload,
} from "./relay.js";
import { FakeRedisServer } from "./testing.js";

const flush = async () => new Promise<void>((resolve) => setImmediate(resolve));

describe("RedisSessionRelay", () => {
  it("records the owning pod of a pending server->client request until it expires", async () => {
    let clock = 10_000;
    const server = new FakeRedisServer(() => clock);
    const relay = new RedisSessionRelay(server.client(), "pod-a");

    await relay.registerPending("s1", 7, 500);
    expect(await relay.ownerOf("s1", 7)).toBe("pod-a");
    expect(await relay.ownerOf("s1", "7")).toBe("pod-a");
    expect(await relay.ownerOf("s1", 8)).toBeUndefined();
    expect(await relay.ownerOf("s2", 7)).toBeUndefined();

    clock += 500;
    expect(await relay.ownerOf("s1", 7)).toBeUndefined();
  });

  it("forwards a response to the owning pod's channel and delivers it to that pod only", async () => {
    const server = new FakeRedisServer();
    const podA = new RedisSessionRelay(server.client(), "pod-a");
    const podB = new RedisSessionRelay(server.client(), "pod-b");
    const receivedByA: RelayedPayload[] = [];
    const receivedByB: RelayedPayload[] = [];

    await podA.start((payload) => receivedByA.push(payload));
    await podB.start((payload) => receivedByB.push(payload));

    const message = {
      jsonrpc: "2.0" as const,
      id: 7,
      result: { action: "accept" },
    };

    await podB.forward("pod-a", { sessionId: "s1", message });
    await flush();

    expect(receivedByA).toEqual([{ sessionId: "s1", message }]);
    expect(receivedByB).toEqual([]);
    expect(server.published[0].channel).toBe(relayChannel("pod-a"));

    await podA.close();
    await podB.forward("pod-a", { sessionId: "s1", message });
    await flush();
    // Closed subscriber receives nothing more.
    expect(receivedByA).toHaveLength(1);
    await podB.close();
  });

  it("drops anything on the channel that is not a JSON-RPC response", async () => {
    const server = new FakeRedisServer();
    const podA = new RedisSessionRelay(server.client(), "pod-a");
    const received: RelayedPayload[] = [];

    await podA.start((payload) => received.push(payload));

    const channel = relayChannel("pod-a");

    server.publish(channel, "not json");
    server.publish(channel, JSON.stringify({ sessionId: "s1" }));
    // A REQUEST must never be injected into a live session through the relay.
    server.publish(
      channel,
      JSON.stringify({
        sessionId: "s1",
        message: { jsonrpc: "2.0", id: 1, method: "tools/call", params: {} },
      }),
    );
    server.publish(
      channel,
      JSON.stringify({
        sessionId: "",
        message: { jsonrpc: "2.0", id: 1, result: {} },
      }),
    );
    await flush();

    expect(received).toEqual([]);
    await podA.close();
  });

  it("start is idempotent", async () => {
    const server = new FakeRedisServer();
    const podA = new RedisSessionRelay(server.client(), "pod-a");
    const received: RelayedPayload[] = [];

    await podA.start((payload) => received.push(payload));
    await podA.start((payload) => received.push(payload));
    await podA.forward("pod-a", {
      sessionId: "s1",
      message: { jsonrpc: "2.0", id: 1, result: {} },
    });
    await flush();

    expect(received).toHaveLength(1);
    await podA.close();
  });
});

describe("relay helpers", () => {
  it("recognises only responses and errors with an id", () => {
    expect(isRelayableResponse({ jsonrpc: "2.0", id: 1, result: {} })).toBe(
      true,
    );
    expect(
      isRelayableResponse({
        jsonrpc: "2.0",
        id: "x",
        error: { code: 1, message: "m" },
      }),
    ).toBe(true);
    expect(isRelayableResponse({ jsonrpc: "2.0", id: 1, method: "m" })).toBe(
      false,
    );
    expect(isRelayableResponse({ jsonrpc: "2.0", method: "m" })).toBe(false);
    expect(isRelayableResponse({ jsonrpc: "1.0", id: 1, result: {} })).toBe(
      false,
    );
    expect(isRelayableResponse({ jsonrpc: "2.0", id: null, result: {} })).toBe(
      false,
    );
    expect(isRelayableResponse(null)).toBe(false);
    expect(isRelayableResponse("str")).toBe(false);
  });

  it("parses a relayed payload strictly", () => {
    expect(
      parseRelayedPayload(
        JSON.stringify({
          sessionId: "s",
          message: { jsonrpc: "2.0", id: 2, result: 1 },
        }),
      ),
    ).toEqual({
      sessionId: "s",
      message: { jsonrpc: "2.0", id: 2, result: 1 },
    });
    expect(parseRelayedPayload("[]")).toBeUndefined();
    expect(parseRelayedPayload("null")).toBeUndefined();
  });

  it("generates a per-process pod id", () => {
    const a = generatePodId();
    const b = generatePodId();

    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(8);
  });

  it("NoopSessionRelay never owns or forwards anything", async () => {
    const relay: McpSessionRelay = new NoopSessionRelay();

    await relay.registerPending("s", 1, 100);
    expect(await relay.ownerOf("s", 1)).toBeUndefined();
    await expect(
      relay.forward("x", {
        sessionId: "s",
        message: { jsonrpc: "2.0", id: 1, result: {} },
      }),
    ).resolves.toBeUndefined();
    await relay.start(() => {});
    await relay.close();
  });
});

describe("RedisSessionRelay hardening", () => {
  it("claimPending is single-use: the owner is returned once, then the entry is gone", async () => {
    const server = new FakeRedisServer();
    const relay = new RedisSessionRelay(server.client(), "pod-a");

    await relay.registerPending("s1", 3, 1_000);
    expect(await relay.claimPending("s1", 3)).toBe("pod-a");
    expect(await relay.claimPending("s1", 3)).toBeUndefined();
    expect(await relay.ownerOf("s1", 3)).toBeUndefined();
    expect(await relay.claimPending("s1", 99)).toBeUndefined();
  });

  it("connect() fails loudly when the subscriber cannot reach Redis, before anything is subscribed", async () => {
    const server = new FakeRedisServer();
    const client = server.client();
    const subscriber = client.duplicate();

    subscriber.connectError = new Error("ECONNREFUSED");
    jest.spyOn(client, "duplicate").mockReturnValue(subscriber);

    const relay = new RedisSessionRelay(client, "pod-a");

    await expect(relay.connect()).rejects.toThrow("ECONNREFUSED");
    await expect(relay.start(() => {})).rejects.toThrow("ECONNREFUSED");
    expect(server.subscribers.size).toBe(0);
  });

  it("logs subscriber socket errors instead of letting them escape as unhandled events", async () => {
    const server = new FakeRedisServer();
    const client = server.client();
    const subscriber = client.duplicate();
    const lines: string[] = [];

    jest.spyOn(client, "duplicate").mockReturnValue(subscriber);

    const relay = new RedisSessionRelay(client, "pod-a", (line) =>
      lines.push(line),
    );

    await relay.start(() => {});
    expect(subscriber.errorListeners).toHaveLength(1);
    subscriber.emitError(new Error("socket reset"));
    expect(lines.join("")).toContain("socket reset");
    await relay.close();
  });
});

describe("request-id tagging", () => {
  it("tags outgoing ids per pod and restores exactly its own", () => {
    const podA = new RedisSessionRelay(new FakeRedisServer().client(), "pod-a");
    const podB = new RedisSessionRelay(new FakeRedisServer().client(), "pod-b");

    expect(podA.tagRequestId(0)).toBe("pod-a#0");
    expect(podA.tagRequestId("x")).toBe("pod-a#x");
    expect(podA.untagRequestId("pod-a#0")).toBe(0);
    expect(podA.untagRequestId("pod-a#x")).toBe("x");
    // Another pod's tag, an untagged id, and a look-alike are passed through untouched.
    expect(podA.untagRequestId("pod-b#0")).toBe("pod-b#0");
    expect(podA.untagRequestId(7)).toBe(7);
    expect(podA.untagRequestId("pod-a")).toBe("pod-a");
    expect(podB.untagRequestId(podA.tagRequestId(3))).toBe("pod-a#3");
  });

  it("two pods prompting on one session never share a pending key", async () => {
    const server = new FakeRedisServer();
    const podA = new RedisSessionRelay(server.client(), "pod-a");
    const podB = new RedisSessionRelay(server.client(), "pod-b");

    await podA.registerPending("s1", podA.tagRequestId(0), 1_000);
    await podB.registerPending("s1", podB.tagRequestId(0), 1_000);
    expect(await podA.ownerOf("s1", "pod-a#0")).toBe("pod-a");
    expect(await podA.ownerOf("s1", "pod-b#0")).toBe("pod-b");
  });

  it("NoopSessionRelay leaves ids alone", () => {
    const relay: McpSessionRelay = new NoopSessionRelay();

    expect(relay.tagRequestId(5)).toBe(5);
    expect(relay.untagRequestId(5)).toBe(5);
  });
});
