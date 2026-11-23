import { act, renderHook } from "@testing-library/react-hooks";
import { objectKeys } from "@appsmith/utils";
import SupportDiagnosticsApi from "ee/api/SupportDiagnosticsApi";
import type { SectionId, SectionResult, SectionStatus } from "./types";
import { SECTION_IDS } from "./types";
import {
  MAX_PARALLEL_COLLECTS,
  useDiagnosticsSections,
} from "./useDiagnosticsSections";

jest.mock("ee/api/SupportDiagnosticsApi", () => ({
  __esModule: true,
  default: {
    listSections: jest.fn(),
    collectSection: jest.fn(),
    recordDownload: jest.fn(),
  },
}));

const listSections = SupportDiagnosticsApi.listSections as jest.Mock;
const collectSection = SupportDiagnosticsApi.collectSection as jest.Mock;

function ok<T>(data: T) {
  return { responseMeta: { status: 200, success: true }, data };
}

function failure(status: number) {
  return {
    responseMeta: { status, success: false, error: { code: "x", message: "" } },
    data: null,
  };
}

function section(
  sectionId: SectionId,
  status: SectionStatus,
  data: Record<string, unknown> | null = null,
): SectionResult {
  return {
    sectionId,
    status,
    collectedAt: status === "NOT_COLLECTED" ? null : "2026-11-22T00:00:00Z",
    data,
    errorCode: null,
  };
}

function listOf(statuses: Partial<Record<SectionId, SectionStatus>>) {
  return ok({
    collectorVersion: "1",
    sections: SECTION_IDS.map((id) =>
      section(id, statuses[id] ?? "NOT_SUPPORTED"),
    ),
  });
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const ONLY_HEALTH = { HEALTH: "NOT_COLLECTED" as SectionStatus };

describe("useDiagnosticsSections", () => {
  beforeEach(() => {
    listSections.mockReset();
    collectSection.mockReset();
  });

  it("should_collectOnlyNotCollectedSections_when_mounted", async () => {
    // Given
    listSections.mockResolvedValue(
      listOf({
        INSTANCE: "OK",
        DEPLOYMENT: "OK",
        FEATURE_FLAGS: "NOT_SUPPORTED",
        APPLICATIONS: "NOT_SUPPORTED",
        DATASOURCES: "NOT_COLLECTED",
        WORKFLOWS: "NOT_COLLECTED",
        IDENTITY: "NOT_COLLECTED",
        AI_MCP: "NOT_COLLECTED",
        HEALTH: "NOT_COLLECTED",
      }),
    );
    collectSection.mockImplementation(async (id: SectionId) =>
      ok(section(id, "OK")),
    );

    // When
    renderHook(() => useDiagnosticsSections());
    await flush();
    await flush();

    // Then
    expect(collectSection).toHaveBeenCalledTimes(5);
    expect(collectSection.mock.calls.map((call) => call[0]).sort()).toEqual(
      ["AI_MCP", "DATASOURCES", "HEALTH", "IDENTITY", "WORKFLOWS"].sort(),
    );
  });

  it("should_runAtMostThreeCollectsAtOnce", async () => {
    // Given
    listSections.mockResolvedValue(
      listOf({
        DATASOURCES: "NOT_COLLECTED",
        WORKFLOWS: "NOT_COLLECTED",
        IDENTITY: "NOT_COLLECTED",
        AI_MCP: "NOT_COLLECTED",
        HEALTH: "NOT_COLLECTED",
      }),
    );
    const pending: Array<Deferred<unknown>> = [];
    let inFlight = 0;
    let maxInFlight = 0;

    collectSection.mockImplementation(async (id: SectionId) => {
      const call = deferred<unknown>();

      pending.push(call);
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);

      try {
        await call.promise;
      } finally {
        inFlight--;
      }

      return ok(section(id, "OK"));
    });

    // When
    const { result } = renderHook(() => useDiagnosticsSections());

    await flush();

    while (pending.length > 0) {
      const next = pending.shift() as Deferred<unknown>;

      await act(async () => {
        next.resolve(undefined);
      });
      await flush();
    }

    // Then
    expect(MAX_PARALLEL_COLLECTS).toBe(3);
    expect(maxInFlight).toBe(3);
    expect(collectSection).toHaveBeenCalledTimes(5);
    expect(result.current.cards.HEALTH.result.status).toBe("OK");
    expect(result.current.cards.HEALTH.collecting).toBe(false);
  });

  it("should_queueManualCollect_when_threeCollectsInFlight", async () => {
    // Given: three automatic collects are pending; INSTANCE is already OK.
    listSections.mockResolvedValue(
      listOf({
        INSTANCE: "OK",
        DATASOURCES: "NOT_COLLECTED",
        WORKFLOWS: "NOT_COLLECTED",
        IDENTITY: "NOT_COLLECTED",
      }),
    );
    const pending: Array<Deferred<unknown>> = [];
    let inFlight = 0;
    let maxInFlight = 0;

    collectSection.mockImplementation(async (id: SectionId) => {
      const call = deferred<unknown>();

      pending.push(call);
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);

      try {
        await call.promise;
      } finally {
        inFlight--;
      }

      return ok(section(id, "OK"));
    });

    const { result } = renderHook(() => useDiagnosticsSections());

    await flush();
    expect(collectSection).toHaveBeenCalledTimes(3);

    // When: a manual refresh of a fourth section
    let manual: Promise<void> = Promise.resolve();

    act(() => {
      manual = result.current.collect("INSTANCE");
    });
    await flush();

    // Then: it waits for a free slot, and its card shows collecting
    expect(collectSection).toHaveBeenCalledTimes(3);
    expect(collectSection).not.toHaveBeenCalledWith("INSTANCE");
    expect(result.current.cards.INSTANCE.collecting).toBe(true);

    // When: one automatic collect finishes
    await act(async () => {
      (pending.shift() as Deferred<unknown>).resolve(undefined);
    });
    await flush();

    // Then: the manual collect takes the slot
    expect(collectSection).toHaveBeenCalledTimes(4);
    expect(collectSection).toHaveBeenLastCalledWith("INSTANCE");

    while (pending.length > 0) {
      const next = pending.shift() as Deferred<unknown>;

      await act(async () => {
        next.resolve(undefined);
      });
      await flush();
    }

    await act(async () => {
      await manual;
    });

    expect(maxInFlight).toBe(3);
    expect(result.current.cards.INSTANCE.collecting).toBe(false);
    expect(result.current.cards.INSTANCE.result.status).toBe("OK");
  });

  it("should_notCallApi_when_unmountedWhileWaitingForSlot", async () => {
    // Given
    listSections.mockResolvedValue(
      listOf({
        INSTANCE: "OK",
        DATASOURCES: "NOT_COLLECTED",
        WORKFLOWS: "NOT_COLLECTED",
        IDENTITY: "NOT_COLLECTED",
      }),
    );
    const pending: Array<Deferred<unknown>> = [];

    collectSection.mockImplementation(async (id: SectionId) => {
      const call = deferred<unknown>();

      pending.push(call);
      await call.promise;

      return ok(section(id, "OK"));
    });

    const { result, unmount } = renderHook(() => useDiagnosticsSections());

    await flush();
    act(() => {
      void result.current.collect("INSTANCE");
    });

    // When
    unmount();
    await act(async () => {
      pending.forEach((call) => call.resolve(undefined));
    });
    await flush();

    // Then
    expect(collectSection).not.toHaveBeenCalledWith("INSTANCE");
  });

  it("should_showBusyState_when_collectResolves429", async () => {
    // Given
    listSections.mockResolvedValue(listOf(ONLY_HEALTH));
    collectSection.mockResolvedValueOnce(failure(429));

    // When
    const { result } = renderHook(() => useDiagnosticsSections());

    await flush();
    await flush();

    // Then
    const health = result.current.cards.HEALTH;

    expect(health.busy).toBe(true);
    expect(health.collecting).toBe(false);
    expect(health.requestFailed).toBe(false);
    expect(health.result.status).toBe("NOT_COLLECTED");

    // When
    collectSection.mockResolvedValueOnce(
      ok(section("HEALTH", "OK", { up: true })),
    );
    await act(async () => {
      await result.current.collect("HEALTH");
    });

    // Then
    expect(result.current.cards.HEALTH.busy).toBe(false);
    expect(result.current.cards.HEALTH.result.status).toBe("OK");
    expect(result.current.cards.HEALTH.result.data).toEqual({ up: true });
  });

  it.each([
    ["a resolved 500", async () => Promise.resolve(failure(500))],
    [
      "a network rejection",
      async () => Promise.reject(new Error("Network Error")),
    ],
  ])(
    "should_setRequestFailed_when_collectResolvesFailureOrRejects (%s)",
    async (_label, outcome) => {
      // Given
      listSections.mockResolvedValue(listOf(ONLY_HEALTH));
      collectSection.mockImplementationOnce(outcome);

      // When
      const { result } = renderHook(() => useDiagnosticsSections());

      await flush();
      await flush();

      // Then
      const health = result.current.cards.HEALTH;

      expect(health.requestFailed).toBe(true);
      expect(health.busy).toBe(false);
      expect(health.collecting).toBe(false);
      expect(health.result.status).toBe("NOT_COLLECTED");

      // When
      collectSection.mockResolvedValueOnce(ok(section("HEALTH", "OK")));
      await act(async () => {
        await result.current.collect("HEALTH");
      });

      // Then
      expect(result.current.cards.HEALTH.requestFailed).toBe(false);
      expect(result.current.cards.HEALTH.result.status).toBe("OK");
    },
  );

  it("should_setRequestFailed_when_collectReturnsAnotherSection", async () => {
    // Given
    listSections.mockResolvedValue(listOf({ ...ONLY_HEALTH, INSTANCE: "OK" }));
    collectSection.mockResolvedValueOnce(
      ok(section("INSTANCE", "OK", { swapped: true })),
    );

    // When
    const { result } = renderHook(() => useDiagnosticsSections());

    await flush();
    await flush();

    // Then
    const health = result.current.cards.HEALTH;

    expect(collectSection).toHaveBeenCalledWith("HEALTH");
    expect(health.requestFailed).toBe(true);
    expect(health.result.sectionId).toBe("HEALTH");
    expect(health.result.status).toBe("NOT_COLLECTED");
    expect(health.result.data).toBeNull();
    expect(result.current.cards.INSTANCE.result.data).toBeNull();
  });

  it("should_ignoreUnknownSectionIds_when_listLoads", async () => {
    // Given
    const known = listOf(ONLY_HEALTH);

    listSections.mockResolvedValue(
      ok({
        collectorVersion: "1",
        sections: [
          ...known.data.sections,
          {
            sectionId: "ROGUE",
            status: "NOT_COLLECTED",
            collectedAt: null,
            data: null,
            errorCode: null,
          },
        ],
      }),
    );
    collectSection.mockImplementation(async (id: SectionId) =>
      ok(section(id, "OK")),
    );

    // When
    const { result } = renderHook(() => useDiagnosticsSections());

    await flush();
    await flush();

    // Then
    expect(collectSection).toHaveBeenCalledTimes(1);
    expect(collectSection).toHaveBeenCalledWith("HEALTH");
    expect(objectKeys(result.current.cards).sort()).toEqual(
      [...SECTION_IDS].sort(),
    );
  });

  it("should_normalizeWireResult_when_listHasEpochSecondsAndNoErrorCode", async () => {
    // Given: the server writes Instant as epoch seconds and drops nulls.
    listSections.mockResolvedValue(
      ok({
        collectorVersion: "1",
        sections: SECTION_IDS.map((id) =>
          id === "INSTANCE"
            ? {
                sectionId: "INSTANCE",
                status: "OK",
                collectedAt: 1794924300.0,
                data: { edition: "CE" },
              }
            : { sectionId: id, status: "NOT_SUPPORTED" },
        ),
      }),
    );

    // When
    const { result } = renderHook(() => useDiagnosticsSections());

    await flush();

    // Then
    const instance = result.current.cards.INSTANCE.result;

    expect(instance.collectedAt).toBe("2026-11-17T14:05:00.000Z");
    expect(instance.errorCode).toBeNull();
    expect(instance.data).toEqual({ edition: "CE" });
    expect(result.current.cards.HEALTH.result).toEqual({
      sectionId: "HEALTH",
      status: "NOT_SUPPORTED",
      collectedAt: null,
      data: null,
      errorCode: null,
    });
  });

  it("should_normalizeWireResult_when_collectHasEpochSecondsAndNoErrorCode", async () => {
    // Given
    listSections.mockResolvedValue(listOf(ONLY_HEALTH));
    collectSection.mockResolvedValueOnce(
      ok({
        sectionId: "HEALTH",
        status: "OK",
        collectedAt: 1794924300.0,
        data: { status: "UP" },
      }),
    );

    // When
    const { result } = renderHook(() => useDiagnosticsSections());

    await flush();
    await flush();

    // Then
    const health = result.current.cards.HEALTH.result;

    expect(health.status).toBe("OK");
    expect(health.collectedAt).toBe("2026-11-17T14:05:00.000Z");
    expect(health.errorCode).toBeNull();
    expect(health.data).toEqual({ status: "UP" });
  });

  it("should_keepSectionUnchecked_acrossCollectRefreshAndReload", async () => {
    // Given
    listSections.mockResolvedValue(listOf(ONLY_HEALTH));
    const first = deferred<unknown>();

    collectSection.mockReturnValueOnce(first.promise);

    const { result } = renderHook(() => useDiagnosticsSections());

    await flush();
    expect(result.current.cards.HEALTH.collecting).toBe(true);
    expect(result.current.cards.HEALTH.included).toBe(true);

    // When
    act(() => {
      result.current.setIncluded("HEALTH", false);
    });
    await act(async () => {
      first.resolve(ok(section("HEALTH", "OK")));
    });
    await flush();

    // Then
    expect(result.current.cards.HEALTH.result.status).toBe("OK");
    expect(result.current.cards.HEALTH.included).toBe(false);

    // When
    collectSection.mockResolvedValueOnce(ok(section("HEALTH", "OK")));
    await act(async () => {
      await result.current.collect("HEALTH");
    });

    // Then
    expect(result.current.cards.HEALTH.included).toBe(false);

    // When
    collectSection.mockResolvedValue(ok(section("HEALTH", "OK")));
    act(() => {
      result.current.reload();
    });
    await flush();
    await flush();

    // Then
    expect(listSections).toHaveBeenCalledTimes(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.cards.HEALTH.included).toBe(false);
    expect(result.current.cards.INSTANCE.included).toBe(true);
  });

  it("should_ignoreSecondCollect_when_sectionAlreadyCollecting", async () => {
    // Given
    listSections.mockResolvedValue(listOf(ONLY_HEALTH));
    const call = deferred<unknown>();

    collectSection.mockReturnValue(call.promise);

    const { result } = renderHook(() => useDiagnosticsSections());

    await flush();
    expect(result.current.cards.HEALTH.collecting).toBe(true);

    // When
    await act(async () => {
      await result.current.collect("HEALTH");
    });
    await act(async () => {
      call.resolve(ok(section("HEALTH", "OK")));
    });
    await flush();

    // Then
    expect(collectSection).toHaveBeenCalledTimes(1);
    expect(result.current.cards.HEALTH.collecting).toBe(false);
  });

  it.each([
    ["a resolved 403", async () => Promise.resolve(failure(403)), "forbidden"],
    ["a resolved 400", async () => Promise.resolve(failure(400)), "forbidden"],
    ["a resolved 500", async () => Promise.resolve(failure(500)), "failed"],
    [
      "a network rejection",
      async () => Promise.reject(new Error("Network Error")),
      "failed",
    ],
  ])(
    "should_setListError_when_listingFails (%s)",
    async (_label, outcome, expected) => {
      // Given
      listSections.mockImplementation(outcome);

      // When
      const { result } = renderHook(() => useDiagnosticsSections());

      await flush();
      await flush();

      // Then
      expect(result.current.loading).toBe(false);
      expect(result.current.listError).toBe(expected);
      expect(collectSection).not.toHaveBeenCalled();
    },
  );

  it("should_ignoreResults_when_unmountedDuringCollect", async () => {
    // Given
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    listSections.mockResolvedValue(listOf(ONLY_HEALTH));
    const call = deferred<unknown>();

    collectSection.mockReturnValue(call.promise);

    const { unmount } = renderHook(() => useDiagnosticsSections());

    await flush();
    expect(collectSection).toHaveBeenCalledTimes(1);

    // When
    unmount();
    await act(async () => {
      call.resolve(ok(section("HEALTH", "OK")));
    });
    await flush();

    // Then
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("should_selectAndClearAll", async () => {
    // Given
    listSections.mockResolvedValue(listOf({}));

    const { result } = renderHook(() => useDiagnosticsSections());

    await flush();

    // When
    act(() => {
      result.current.setAllIncluded(false);
    });

    // Then
    SECTION_IDS.forEach((id) => {
      expect(result.current.cards[id].included).toBe(false);
    });

    // When
    act(() => {
      result.current.setAllIncluded(true);
    });

    // Then
    SECTION_IDS.forEach((id) => {
      expect(result.current.cards[id].included).toBe(true);
    });
  });
});
