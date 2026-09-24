import { randomUUID } from "node:crypto";
import { hostname } from "node:os";

// Cross-pod delivery of JSON-RPC RESPONSES. During a destructive confirm the server sends the client an
// elicitation request and awaits the answer; that answer arrives as a separate HTTP POST which, behind a
// load balancer, may land on a pod other than the one holding the pending promise. Each outgoing server->client
// request is registered here (session + JSON-RPC id -> owning pod); a pod that receives a response it does not own
// publishes it to the owner's channel, and the owner claims the pending entry (single use) and feeds the response
// into its local transport.

export type RelayableMessage = Record<string, unknown> & {
  jsonrpc: "2.0";
  id: string | number;
};

export interface RelayedPayload {
  sessionId: string;
  message: RelayableMessage;
}

export interface McpSessionRelay {
  readonly podId: string;
  registerPending(
    sessionId: string,
    rpcId: string | number,
    ttlMs: number,
  ): Promise<void>;
  // The pod that owns the pending server->client request, or undefined when nothing is pending (expired, never
  // registered, or a response the SDK will simply ignore).
  ownerOf(
    sessionId: string,
    rpcId: string | number,
  ): Promise<string | undefined>;
  // Consumes the pending entry and returns its owner. Called by the receiving pod right before it delivers a
  // relayed response, so an entry can be delivered at most once.
  claimPending(
    sessionId: string,
    rpcId: string | number,
  ): Promise<string | undefined>;
  forward(podId: string, payload: RelayedPayload): Promise<void>;
  // Subscribes this pod's own channel. Called once at startup.
  start(onForwarded: (payload: RelayedPayload) => void): Promise<void>;
  close(): Promise<void>;
  // The SDK numbers server->client requests from 0 PER server instance, so two pods prompting on the same session
  // would register the same (session, id) and an answer could resolve the wrong prompt. Outgoing ids are therefore
  // tagged with the pod before they leave, and a tagged id is restored to what the SDK issued before a response is
  // handed back to it. Both are identity for a single-pod relay.
  tagRequestId(id: string | number): string | number;
  untagRequestId(id: string | number): string | number;
}

// Unique per PROCESS, not per host: a restarted pod must never receive relays registered by its previous
// incarnation, whose pending promises died with it.
export function generatePodId(): string {
  return `${hostname()}-${randomUUID().slice(0, 8)}`;
}

// Single-process deployments: every response lands on the pod that asked, so nothing is ever forwarded.
export class NoopSessionRelay implements McpSessionRelay {
  readonly podId = "local";

  async registerPending(): Promise<void> {}

  async ownerOf(): Promise<string | undefined> {
    return undefined;
  }

  async claimPending(): Promise<string | undefined> {
    return undefined;
  }

  async forward(): Promise<void> {}

  async start(): Promise<void> {}

  async close(): Promise<void> {}

  tagRequestId(id: string | number): string | number {
    return id;
  }

  untagRequestId(id: string | number): string | number {
    return id;
  }
}

export interface RelaySubscriber {
  connect(): Promise<unknown>;
  subscribe(
    channel: string,
    listener: (message: string, channel: string) => void,
  ): Promise<unknown>;
  close(): Promise<unknown>;
  // node-redis emits `error` for runtime socket failures and reconnects on its own; an unhandled `error` event
  // would instead throw and take the whole process down.
  on?(event: "error", listener: (error: Error) => void): unknown;
}

// The subset of node-redis the relay calls. PUBLISH/SUBSCRIBE require a dedicated subscriber connection, hence
// duplicate(); both standalone and cluster clients provide every method here.
export interface RelayRedis {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options: { PX: number }): Promise<unknown>;
  del(key: string): Promise<unknown>;
  publish(channel: string, message: string): Promise<unknown>;
  duplicate(): RelaySubscriber;
}

const PENDING_PREFIX = "appsmith:mcp:pending:";
const CHANNEL_PREFIX = "appsmith:mcp:relay:";

function pendingKey(sessionId: string, rpcId: string | number): string {
  return `${PENDING_PREFIX}${sessionId}:${String(rpcId)}`;
}

export function relayChannel(podId: string): string {
  return `${CHANNEL_PREFIX}${podId}`;
}

export class RedisSessionRelay implements McpSessionRelay {
  private subscriber: RelaySubscriber | undefined;
  private subscribed = false;

  constructor(
    private readonly redis: RelayRedis,
    readonly podId: string = generatePodId(),
    private readonly logSink: (line: string) => void = (line) =>
      process.stderr.write(line),
  ) {}

  async registerPending(
    sessionId: string,
    rpcId: string | number,
    ttlMs: number,
  ): Promise<void> {
    await this.redis.set(pendingKey(sessionId, rpcId), this.podId, {
      PX: Math.max(1, ttlMs),
    });
  }

  async ownerOf(
    sessionId: string,
    rpcId: string | number,
  ): Promise<string | undefined> {
    const owner = await this.redis.get(pendingKey(sessionId, rpcId));

    return typeof owner === "string" && owner.length > 0 ? owner : undefined;
  }

  async claimPending(
    sessionId: string,
    rpcId: string | number,
  ): Promise<string | undefined> {
    const owner = await this.ownerOf(sessionId, rpcId);

    if (owner !== undefined) await this.redis.del(pendingKey(sessionId, rpcId));

    return owner;
  }

  async forward(podId: string, payload: RelayedPayload): Promise<void> {
    await this.redis.publish(relayChannel(podId), JSON.stringify(payload));
  }

  // Opens the subscriber connection WITHOUT subscribing yet, so startup code can fail loudly on an unreachable
  // Redis before the HTTP server exists. start() reuses the connection.
  async connect(): Promise<void> {
    if (this.subscriber) return;

    const subscriber = this.redis.duplicate();

    subscriber.on?.("error", (error) => {
      this.logSink(
        `Appsmith MCP session relay subscriber error: ${error.message}\n`,
      );
    });
    await subscriber.connect();
    this.subscriber = subscriber;
  }

  async start(onForwarded: (payload: RelayedPayload) => void): Promise<void> {
    if (this.subscribed) return;

    await this.connect();

    const subscriber = this.subscriber as RelaySubscriber;

    await subscriber.subscribe(relayChannel(this.podId), (raw) => {
      const payload = parseRelayedPayload(raw);

      if (payload) onForwarded(payload);
    });
    this.subscribed = true;
  }

  async close(): Promise<void> {
    const subscriber = this.subscriber;

    this.subscriber = undefined;
    this.subscribed = false;
    await subscriber?.close().catch(() => {});
  }

  // "<podId>#<id>". The separator never occurs in a hostname-derived pod id, and JSON-RPC ids may be strings.
  tagRequestId(id: string | number): string | number {
    return `${this.podId}#${String(id)}`;
  }

  untagRequestId(id: string | number): string | number {
    const prefix = `${this.podId}#`;

    if (typeof id !== "string" || !id.startsWith(prefix)) return id;

    const original = id.slice(prefix.length);

    // The SDK issued a number, compares responses by Number(id), and keys its handlers by that number.
    return /^\d+$/.test(original) ? Number(original) : original;
  }
}

// Only well-formed JSON-RPC responses/errors cross the relay; anything else (a request, a notification, junk on the
// channel) is dropped so a foreign publisher can never inject a method call into a live session.
export function parseRelayedPayload(raw: string): RelayedPayload | undefined {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }

  if (typeof parsed !== "object" || parsed === null) return undefined;

  const { message, sessionId } = parsed as {
    message?: unknown;
    sessionId?: unknown;
  };

  if (typeof sessionId !== "string" || sessionId.length === 0) return undefined;

  if (!isRelayableResponse(message)) return undefined;

  return { sessionId, message };
}

// A JSON-RPC response (result or error) with an id and NO method.
export function isRelayableResponse(
  message: unknown,
): message is RelayableMessage {
  if (typeof message !== "object" || message === null) return false;

  const candidate = message as Record<string, unknown>;

  if (candidate.jsonrpc !== "2.0") return false;

  if ("method" in candidate) return false;

  if (typeof candidate.id !== "string" && typeof candidate.id !== "number") {
    return false;
  }

  return "result" in candidate || "error" in candidate;
}
