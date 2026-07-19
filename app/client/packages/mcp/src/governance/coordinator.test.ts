import {
  DestructiveConfirmationError,
  GovernanceLockError,
  GovernanceRevisionConflictError,
  McpGovernanceCoordinator,
} from "./coordinator.js";
import type {
  McpChangeRecord,
  McpGovernanceStore,
  PreparedConfirmation,
} from "./store.js";

class MemoryGovernanceStore implements McpGovernanceStore {
  readonly calls: string[] = [];
  readonly changes: McpChangeRecord[] = [];
  readonly confirmations = new Map<string, PreparedConfirmation>();
  lockId: string | undefined = "lock-1";

  async acquireLock(
    entityKey: string,
    ttlMs: number,
  ): Promise<string | undefined> {
    this.calls.push(`acquire:${entityKey}:${ttlMs}`);

    return this.lockId;
  }

  async releaseLock(entityKey: string, lockId: string): Promise<void> {
    this.calls.push(`release:${entityKey}:${lockId}`);
  }

  async createConfirmation(
    confirmation: PreparedConfirmation,
    ttlMs: number,
  ): Promise<void> {
    this.calls.push(`create-confirmation:${ttlMs}`);
    this.confirmations.set(confirmation.id, confirmation);
  }

  async consumeConfirmation(
    id: string,
  ): Promise<PreparedConfirmation | undefined> {
    this.calls.push(`consume-confirmation:${id}`);
    const confirmation = this.confirmations.get(id);

    this.confirmations.delete(id);

    return confirmation;
  }

  async peekConfirmation(
    id: string,
  ): Promise<PreparedConfirmation | undefined> {
    this.calls.push(`peek-confirmation:${id}`);

    return this.confirmations.get(id);
  }

  async saveChange(change: McpChangeRecord): Promise<void> {
    this.calls.push(`save-change:${change.id}`);
    this.changes.push(change);
  }

  async getChange(): Promise<McpChangeRecord | undefined> {
    return undefined;
  }

  async listChanges(): Promise<McpChangeRecord[]> {
    return this.changes;
  }

  async getAnyChange(): Promise<McpChangeRecord | undefined> {
    return undefined;
  }

  async listAllChanges(): Promise<McpChangeRecord[]> {
    return this.changes;
  }
}

const binding = {
  actorId: "user-1",
  entityKey: "application:app-1",
  operation: "delete",
  revision: "revision-1",
  digest: "digest-1",
};

function coordinator(store: MemoryGovernanceStore): McpGovernanceCoordinator {
  return new McpGovernanceCoordinator(store, {
    lockTtlMs: 1_000,
    confirmationTtlMs: 2_000,
    now: () => new Date("2026-07-12T00:00:00.000Z"),
    createId: jest
      .fn()
      .mockReturnValueOnce("change-1")
      .mockReturnValueOnce("confirm-1"),
  });
}

describe("McpGovernanceCoordinator.execute", () => {
  it("locks, mutates, records the completed change, then releases the lock", async () => {
    const store = new MemoryGovernanceStore();
    const result = await coordinator(store).execute({
      actorId: "user-1",
      organizationId: "org-1",
      entityKey: "application:app-1",
      operation: "update",
      expectedRevision: "revision-1",
      currentRevision: "revision-1",
      mutate: async () => {
        expect(store.calls).toEqual(["acquire:application:app-1:1000"]);

        return {
          value: { updated: true },
          revisionAfter: "revision-2",
          rollback: { previousName: "Old" },
          summary: { name: "New" },
        };
      },
    });

    expect(result).toEqual({ value: { updated: true }, changeId: "change-1" });
    expect(store.changes).toEqual([
      {
        id: "change-1",
        actorId: "user-1",
        organizationId: "org-1",
        entityKey: "application:app-1",
        operation: "update",
        revisionBefore: "revision-1",
        revisionAfter: "revision-2",
        createdAt: new Date("2026-07-12T00:00:00.000Z"),
        rollback: { previousName: "Old" },
        summary: { name: "New" },
      },
    ]);
    expect(store.calls).toEqual([
      "acquire:application:app-1:1000",
      "save-change:change-1",
      "release:application:app-1:lock-1",
    ]);
  });

  it("rejects a missing lock without invoking the mutation", async () => {
    const store = new MemoryGovernanceStore();

    store.lockId = undefined;
    const mutate = jest.fn();

    await expect(
      coordinator(store).execute({
        actorId: "user-1",
        organizationId: "org-1",
        entityKey: "application:app-1",
        operation: "update",
        expectedRevision: "revision-1",
        currentRevision: "revision-1",
        mutate,
      }),
    ).rejects.toBeInstanceOf(GovernanceLockError);

    expect(mutate).not.toHaveBeenCalled();
    expect(store.calls).toEqual(["acquire:application:app-1:1000"]);
  });

  it("rejects a stale revision and releases the acquired lock", async () => {
    const store = new MemoryGovernanceStore();
    const mutate = jest.fn();

    await expect(
      coordinator(store).execute({
        actorId: "user-1",
        organizationId: "org-1",
        entityKey: "application:app-1",
        operation: "update",
        expectedRevision: "revision-1",
        currentRevision: "revision-2",
        mutate,
      }),
    ).rejects.toBeInstanceOf(GovernanceRevisionConflictError);

    expect(mutate).not.toHaveBeenCalled();
    expect(store.changes).toEqual([]);
    expect(store.calls).toEqual([
      "acquire:application:app-1:1000",
      "release:application:app-1:lock-1",
    ]);
  });

  it("releases the lock when the mutation fails", async () => {
    const store = new MemoryGovernanceStore();

    await expect(
      coordinator(store).execute({
        actorId: "user-1",
        organizationId: "org-1",
        entityKey: "application:app-1",
        operation: "update",
        expectedRevision: "revision-1",
        currentRevision: "revision-1",
        mutate: async () => {
          throw new Error("mutation failed");
        },
      }),
    ).rejects.toThrow("mutation failed");

    expect(store.changes).toEqual([]);
    expect(store.calls).toEqual([
      "acquire:application:app-1:1000",
      "release:application:app-1:lock-1",
    ]);
  });
});

describe("destructive confirmations", () => {
  it("prepares and consumes a confirmation bound to its destructive operation", async () => {
    const store = new MemoryGovernanceStore();
    const service = coordinator(store);

    const confirmation = await service.prepareDestructiveConfirmation(binding);
    const consumed = await service.consumeDestructiveConfirmation({
      confirmationId: confirmation.id,
      ...binding,
    });

    expect(confirmation).toEqual({
      id: "change-1",
      ...binding,
      expiresAt: new Date("2026-07-12T00:00:02.000Z"),
    });
    expect(consumed).toEqual(confirmation);
    expect(store.calls).toEqual([
      "create-confirmation:2000",
      "consume-confirmation:change-1",
    ]);
  });

  it("rejects mismatches and prevents replay after consumption", async () => {
    const store = new MemoryGovernanceStore();
    const service = coordinator(store);
    const confirmation = await service.prepareDestructiveConfirmation(binding);

    await expect(
      service.consumeDestructiveConfirmation({
        confirmationId: confirmation.id,
        ...binding,
        digest: "different-digest",
      }),
    ).rejects.toBeInstanceOf(DestructiveConfirmationError);

    await expect(
      service.consumeDestructiveConfirmation({
        confirmationId: confirmation.id,
        ...binding,
      }),
    ).rejects.toBeInstanceOf(DestructiveConfirmationError);
  });

  it("confirmationBelongsTo: true only for the preparing actor, via a NON-consuming peek [security F1]", async () => {
    const store = new MemoryGovernanceStore();
    const service = coordinator(store);
    const confirmation = await service.prepareDestructiveConfirmation(binding);

    // Never issued: false, without consuming anything.
    expect(await service.confirmationBelongsTo("forged-id", "user-1")).toBe(
      false,
    );
    // Prepared by a different actor: false.
    expect(
      await service.confirmationBelongsTo(confirmation.id, "someone-else"),
    ).toBe(false);
    // The owner: true — and the peek left the one-time token intact and consumable.
    expect(
      await service.confirmationBelongsTo(confirmation.id, binding.actorId),
    ).toBe(true);
    expect(store.confirmations.has(confirmation.id)).toBe(true);
    await expect(
      service.consumeDestructiveConfirmation({
        confirmationId: confirmation.id,
        ...binding,
      }),
    ).resolves.toEqual(confirmation);
  });
});
