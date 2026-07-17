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
  now?: () => Date;
  createId?: () => string;
}

export class McpGovernanceCoordinator {
  private readonly lockTtlMs: number;
  private readonly confirmationTtlMs: number;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(
    private readonly store: McpGovernanceStore,
    options: McpGovernanceCoordinatorOptions = {},
  ) {
    this.lockTtlMs = options.lockTtlMs ?? 30_000;
    this.confirmationTtlMs = options.confirmationTtlMs ?? 5 * 60_000;
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

      await this.store.saveChange({
        id: changeId,
        actorId: request.actorId,
        entityKey: request.entityKey,
        operation: request.operation,
        revisionBefore: request.currentRevision,
        revisionAfter: result.revisionAfter,
        createdAt: this.now(),
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
  ): Promise<McpChangeRecord | undefined> {
    return this.store.getChange(id, actorId);
  }

  async listChanges(
    actorId: string,
    limit: number,
  ): Promise<McpChangeRecord[]> {
    return this.store.listChanges(actorId, limit);
  }

  // Instance-admin cross-actor reads (gated at the tool layer on adminSettingsVisible).
  async getAnyChange(id: string): Promise<McpChangeRecord | undefined> {
    return this.store.getAnyChange(id);
  }

  async listAllChanges(limit: number): Promise<McpChangeRecord[]> {
    return this.store.listAllChanges(limit);
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
