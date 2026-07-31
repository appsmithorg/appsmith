import { randomUUID } from "node:crypto";

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
// agent can acquire it mid-flight and lose an update. The slowest is a git commit (GIT_COMMIT_TIMEOUT_MS, 120s
// in app.ts), so this sits above that with headroom rather than the 30s that used to expire underneath it.
export const DEFAULT_LOCK_TTL_MS = 150_000;

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
}
