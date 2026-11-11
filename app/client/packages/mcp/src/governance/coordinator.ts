import { randomUUID } from "node:crypto";

import {
  compileJsObject,
  jsBodyHash,
  MAX_CLASSIFIED_BODY_BYTES,
  parseStoredJsDefinition,
  type JsObjectDefinition,
} from "../builder/jsObject.js";

import type {
  McpChangeRecord,
  McpGovernanceStore,
  PreparedConfirmation,
} from "./store.js";

export type { McpChangeRecord } from "./store.js";

export class GovernanceLockError extends Error {
  constructor(entityKey: string) {
    super(`entity is already being changed: ${entityKey}`);
    this.name = "GovernanceLockError";
  }
}

export class GovernanceRevisionConflictError extends Error {
  constructor(expectedRevision: string, currentRevision: string) {
    super(
      `revision conflict: expected ${expectedRevision}, current ${currentRevision}`,
    );
    this.name = "GovernanceRevisionConflictError";
  }
}

export class DestructiveConfirmationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DestructiveConfirmationError";
  }
}

export interface MutationResult<TResult> {
  value: TResult;
  revisionAfter: string;
  rollback?: Record<string, unknown>;
  summary?: Record<string, unknown>;
}

export interface CoordinatedMutation<TResult> {
  actorId: string;
  // The caller's organization (tenant); stamped onto the audit record so every read can be tenant-scoped.
  organizationId: string;
  entityKey: string;
  operation: string;
  expectedRevision: string;
  currentRevision: string;
  mutate(): Promise<MutationResult<TResult>>;
}

export interface DestructiveConfirmationBinding {
  actorId: string;
  entityKey: string;
  operation: string;
  revision: string;
  digest: string;
  // Optional confirm-time context stored inside the one-time confirmation (see PreparedConfirmation.context). Must
  // be JSON-serializable and must NOT be the only thing that authorizes the operation: the digest/revision binding
  // stays the security control, the context merely reconstructs what the prompt and execution need.
  context?: Record<string, unknown>;
}

export interface ConsumeDestructiveConfirmation
  extends DestructiveConfirmationBinding {
  confirmationId: string;
}

export interface McpGovernanceCoordinatorOptions {
  lockTtlMs?: number;
  confirmationTtlMs?: number;
  changeRetentionMs?: number;
  now?: () => Date;
  createId?: () => string;
}

// Retention for governance change records, stamped onto every saved change as `expiresAt` so the TTL index the
// store declares actually reclaims them. Without a stamped field Mongo's TTL skips the document entirely and the
// collection — which carries a full rollback blob per governed mutation — grows forever inside the product's own
// database. A change older than this window is no longer rollbackable and drops out of the audit trail; 90 days
// matches the default MCP token lifetime, so a record cannot outlive the credential that created it by much.
export const DEFAULT_CHANGE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

// The lock is held across the caller's mutate(), so it MUST outlive the slowest governed mutation or a second
// agent can acquire it mid-flight and lose an update. The slowest is create_branch: a refs re-read
// (REQUEST_TIMEOUT_MS, 30s) followed by create-ref (GIT_CREATE_REF_TIMEOUT_MS, 120s in app.ts); a commit is
// bounded by GIT_COMMIT_TIMEOUT_MS (120s). This sits above that 150s sum with headroom.
export const DEFAULT_LOCK_TTL_MS = 180_000;

export class McpGovernanceCoordinator {
  private readonly lockTtlMs: number;
  private readonly confirmationTtlMs: number;
  private readonly changeRetentionMs: number;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(
    private readonly store: McpGovernanceStore,
    options: McpGovernanceCoordinatorOptions = {},
  ) {
    this.lockTtlMs = options.lockTtlMs ?? DEFAULT_LOCK_TTL_MS;
    this.confirmationTtlMs = options.confirmationTtlMs ?? 5 * 60_000;
    this.changeRetentionMs =
      options.changeRetentionMs ?? DEFAULT_CHANGE_RETENTION_MS;
    this.now = options.now ?? (() => new Date());
    this.createId = options.createId ?? randomUUID;
  }

  async execute<TResult>(
    request: CoordinatedMutation<TResult>,
  ): Promise<{ value: TResult; changeId: string }> {
    const lockId = await this.store.acquireLock(
      request.entityKey,
      this.lockTtlMs,
    );

    if (!lockId) {
      throw new GovernanceLockError(request.entityKey);
    }

    try {
      if (request.expectedRevision !== request.currentRevision) {
        throw new GovernanceRevisionConflictError(
          request.expectedRevision,
          request.currentRevision,
        );
      }

      const result = await request.mutate();
      const changeId = this.createId();
      const createdAt = this.now();

      await this.store.saveChange({
        id: changeId,
        actorId: request.actorId,
        organizationId: request.organizationId,
        entityKey: request.entityKey,
        operation: request.operation,
        revisionBefore: request.currentRevision,
        revisionAfter: result.revisionAfter,
        createdAt,
        // Stamped so the store's `{expiresAt: 1}, {expireAfterSeconds: 0}` TTL index actually reclaims this
        // record. Mongo's TTL silently skips documents missing the field, so an unstamped record lives forever.
        expiresAt: new Date(createdAt.getTime() + this.changeRetentionMs),
        rollback: result.rollback ?? {},
        summary: result.summary ?? {},
      });

      // Return the audit id so every governed mutation can echo its change/audit id to the caller.
      return { value: result.value, changeId };
    } finally {
      await this.store.releaseLock(request.entityKey, lockId);
    }
  }

  async getChange(
    id: string,
    actorId: string,
    organizationId: string,
  ): Promise<McpChangeRecord | undefined> {
    return this.store.getChange(id, actorId, organizationId);
  }

  async listChanges(
    actorId: string,
    organizationId: string,
    limit: number,
  ): Promise<McpChangeRecord[]> {
    return this.store.listChanges(actorId, organizationId, limit);
  }

  // Cross-actor admin reads (gated on isSuperUser at the tool layer) — still tenant-scoped by organizationId, since
  // isSuperUser is a per-org signal in EE.
  async getAnyChange(
    id: string,
    organizationId: string,
  ): Promise<McpChangeRecord | undefined> {
    return this.store.getAnyChange(id, organizationId);
  }

  async listAllChanges(
    organizationId: string,
    limit: number,
  ): Promise<McpChangeRecord[]> {
    return this.store.listAllChanges(organizationId, limit);
  }

  async prepareDestructiveConfirmation(
    binding: DestructiveConfirmationBinding,
  ): Promise<PreparedConfirmation> {
    const confirmation: PreparedConfirmation = {
      id: this.createId(),
      ...binding,
      expiresAt: new Date(this.now().getTime() + this.confirmationTtlMs),
    };

    await this.store.createConfirmation(confirmation, this.confirmationTtlMs);

    return confirmation;
  }

  // NON-consuming ownership check [SECURITY F1]: true iff the confirmation exists (not expired/consumed) AND was
  // prepared by this actor. The elicitation layer calls this BEFORE prompting the human, so a forged, expired, or
  // foreign confirmationId can never raise a genuine-looking destructive-approval dialog. Existence + actor binding
  // only — the full entityKey/operation/revision/digest match stays at consume time.
  async confirmationBelongsTo(
    confirmationId: string,
    actorId: string,
  ): Promise<boolean> {
    const confirmation = await this.store.peekConfirmation(confirmationId);

    return confirmation !== undefined && confirmation.actorId === actorId;
  }

  // NON-consuming, actor-bound read of the whole confirmation (context included) for the confirm step. Readable
  // from ANY replica because it lives in the store, not in the memory of the pod that ran prepare. A foreign,
  // expired, consumed, or unknown confirmationId reads nothing.
  async readDestructiveConfirmation(
    confirmationId: string,
    actorId: string,
  ): Promise<PreparedConfirmation | undefined> {
    const confirmation = await this.store.peekConfirmation(confirmationId);

    return confirmation !== undefined && confirmation.actorId === actorId
      ? confirmation
      : undefined;
  }

  // Drops a confirmation that can no longer succeed (its bound revision drifted) so a later confirm reads
  // "missing" instead of re-running the drift checks. Actor-bound: only the preparer can discard their own token.
  // The token would otherwise simply expire unconsumed — this is housekeeping, not a security control.
  async discardDestructiveConfirmation(
    confirmationId: string,
    actorId: string,
  ): Promise<void> {
    const confirmation = await this.store.peekConfirmation(confirmationId);

    if (confirmation !== undefined && confirmation.actorId === actorId) {
      await this.store.consumeConfirmation(confirmationId);
    }
  }

  async consumeDestructiveConfirmation(
    request: ConsumeDestructiveConfirmation,
  ): Promise<PreparedConfirmation> {
    const confirmation = await this.store.consumeConfirmation(
      request.confirmationId,
    );

    if (!confirmation) {
      throw new DestructiveConfirmationError(
        "destructive confirmation is missing, expired, or already used",
      );
    }

    if (
      confirmation.actorId !== request.actorId ||
      confirmation.entityKey !== request.entityKey ||
      confirmation.operation !== request.operation ||
      confirmation.revision !== request.revision ||
      confirmation.digest !== request.digest
    ) {
      throw new DestructiveConfirmationError(
        "destructive confirmation does not match this operation",
      );
    }

    return confirmation;
  }

  // Whether JS objects can be written in the readable layout: the store must keep their definitions, because a
  // readable body carries no marker.
  get supportsJsDefinitions(): boolean {
    return (
      typeof this.store.saveJsDefinition === "function" &&
      typeof this.store.findJsDefinitions === "function"
    );
  }

  // Records the definition a readable body was compiled from. Called BEFORE the body is written: if the record
  // cannot be saved, the write does not happen, so a readable body never exists without its definition.
  async saveJsDefinition(
    organizationId: string,
    body: string,
    definition: JsObjectDefinition,
  ): Promise<void> {
    if (!this.store.saveJsDefinition) {
      throw new Error("this governance store does not keep JS definitions");
    }

    if (organizationId === "") {
      throw new Error("JS definitions are stored per organization");
    }

    if (Buffer.byteLength(body, "utf8") > MAX_CLASSIFIED_BODY_BYTES) {
      throw new Error("the compiled JS object is larger than 256 KB");
    }

    const json = JSON.stringify(definition);

    // Saved exactly as every pod will read it back, so the body cannot read as MCP-written on one pod and as
    // editor-written on another.
    const stored = parseStoredJsDefinition(json);

    if (stored === undefined) {
      throw new Error("the JS-object definition does not match its schema");
    }

    // The record is trusted by hash alone when it is read back, so it must describe exactly this body.
    if (compileJsObject(stored, { readable: true }) !== body) {
      throw new Error("the JS-object definition does not compile to this body");
    }

    await this.store.saveJsDefinition({
      organizationId,
      codeHash: jsBodyHash(body),
      definition: json,
      createdAt: this.now(),
    });
  }

  // The organization's stored definitions of the given bodies, by body hash. A body with no record (or with a
  // record that no longer parses) is absent, so it reads as editor-authored.
  async loadJsDefinitions(
    organizationId: string,
    bodies: readonly string[],
  ): Promise<Map<string, JsObjectDefinition>> {
    const found = new Map<string, JsObjectDefinition>();

    if (
      !this.store.findJsDefinitions ||
      organizationId === "" ||
      bodies.length === 0
    ) {
      return found;
    }

    const hashes = [...new Set(bodies.map(jsBodyHash))];
    const records = await this.store.findJsDefinitions(organizationId, hashes);

    for (const record of records) {
      const definition =
        record.organizationId === organizationId
          ? parseStoredJsDefinition(record.definition)
          : undefined;

      if (definition !== undefined) found.set(record.codeHash, definition);
    }

    return found;
  }
}
