import { useCallback, useEffect, useRef, useState } from "react";
import SupportDiagnosticsApi from "ee/api/SupportDiagnosticsApi";
import type { SectionId, SectionResult } from "./types";
import {
  SECTION_IDS,
  isFailure,
  normalizeSectionResult,
  responseStatus,
} from "./types";

export interface CardState {
  result: SectionResult;
  collecting: boolean;
  busy: boolean;
  requestFailed: boolean;
  included: boolean;
}

export type ListError = "none" | "forbidden" | "failed";

/** The most section collects the page runs at the same time. */
export const MAX_PARALLEL_COLLECTS = 3;

const BUSY_STATUS = 429;
const FORBIDDEN_LIST_STATUSES = [400, 403];

function placeholderResult(sectionId: SectionId): SectionResult {
  return {
    sectionId,
    status: "NOT_COLLECTED",
    collectedAt: null,
    data: null,
    errorCode: null,
  };
}

function initialCards(): Record<SectionId, CardState> {
  const cards = {} as Record<SectionId, CardState>;

  SECTION_IDS.forEach((id) => {
    cards[id] = {
      result: placeholderResult(id),
      collecting: false,
      busy: false,
      requestFailed: false,
      included: true,
    };
  });

  return cards;
}

/**
 * Lists the diagnostics sections, then collects every `NOT_COLLECTED` section.
 * Automatic and manual collects share one limit: at most
 * `MAX_PARALLEL_COLLECTS` requests at a time. Only `setIncluded` and
 * `setAllIncluded` change a card's `included` flag.
 */
export function useDiagnosticsSections() {
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<ListError>("none");
  const [collectorVersion, setCollectorVersion] = useState<string | null>(null);
  const [cards, setCards] =
    useState<Record<SectionId, CardState>>(initialCards);

  const mountedRef = useRef(true);
  const collectingRef = useRef(new Set<SectionId>());
  const loadGenerationRef = useRef(0);

  useEffect(function trackMounted() {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const updateCard = useCallback((id: SectionId, patch: Partial<CardState>) => {
    if (!mountedRef.current) return;

    setCards((previous) => ({
      ...previous,
      [id]: { ...previous[id], ...patch },
    }));
  }, []);

  // One limit for automatic and manual collects: at most
  // MAX_PARALLEL_COLLECTS requests in flight. A collect waiting for a slot is
  // already marked `collecting`, so its Refresh/Retry button is disabled.
  const inFlightRef = useRef(0);
  const slotWaitersRef = useRef<Array<() => void>>([]);

  const acquireSlot = useCallback(async (): Promise<void> => {
    if (inFlightRef.current < MAX_PARALLEL_COLLECTS) {
      inFlightRef.current++;

      return Promise.resolve();
    }

    return new Promise((resolve) => slotWaitersRef.current.push(resolve));
  }, []);

  const releaseSlot = useCallback(() => {
    const next = slotWaitersRef.current.shift();

    // The slot passes straight to the next waiter, so the count stays.
    if (next) next();
    else inFlightRef.current--;
  }, []);

  const collect = useCallback(
    async (id: SectionId): Promise<void> => {
      if (collectingRef.current.has(id)) return;

      collectingRef.current.add(id);
      updateCard(id, { collecting: true });

      await acquireSlot();

      try {
        if (!mountedRef.current) return;

        const response = await SupportDiagnosticsApi.collectSection(id);

        if (isFailure(response)) {
          const busy = responseStatus(response) === BUSY_STATUS;

          updateCard(id, { busy, requestFailed: !busy });
        } else if (response.data?.sectionId !== id) {
          // A result for another section never replaces this card's result.
          updateCard(id, { busy: false, requestFailed: true });
        } else {
          updateCard(id, {
            result: normalizeSectionResult(response.data),
            busy: false,
            requestFailed: false,
          });
        }
      } catch {
        updateCard(id, { busy: false, requestFailed: true });
      } finally {
        releaseSlot();
        collectingRef.current.delete(id);
        updateCard(id, { collecting: false });
      }
    },
    [acquireSlot, releaseSlot, updateCard],
  );

  const load = useCallback(async (): Promise<void> => {
    const generation = ++loadGenerationRef.current;
    const isCurrent = () =>
      mountedRef.current && generation === loadGenerationRef.current;

    setLoading(true);
    setListError("none");

    let sections: SectionResult[];

    try {
      const response = await SupportDiagnosticsApi.listSections();

      if (!isCurrent()) return;

      if (isFailure(response)) {
        const status = responseStatus(response);

        setListError(
          status !== undefined && FORBIDDEN_LIST_STATUSES.includes(status)
            ? "forbidden"
            : "failed",
        );
        setLoading(false);

        return;
      }

      // Results arrive in the server's wire shape. Only known section IDs
      // are merged into the cards or collected.
      sections = response.data.sections
        .map(normalizeSectionResult)
        .filter((result) => SECTION_IDS.includes(result.sectionId));
      setCollectorVersion(response.data.collectorVersion);
    } catch {
      if (!isCurrent()) return;

      setListError("failed");
      setLoading(false);

      return;
    }

    setCards((previous) => {
      const next = { ...previous };

      sections.forEach((result) => {
        next[result.sectionId] = {
          ...previous[result.sectionId],
          result,
          busy: false,
          requestFailed: false,
        };
      });

      return next;
    });
    setLoading(false);

    const queue = sections
      .filter((result) => result.status === "NOT_COLLECTED")
      .map((result) => result.sectionId);

    const worker = async (): Promise<void> => {
      while (queue.length > 0 && isCurrent()) {
        const id = queue.shift() as SectionId;

        await collect(id);
      }
    };

    const workers = Math.min(MAX_PARALLEL_COLLECTS, queue.length);

    await Promise.all(Array.from({ length: workers }, worker));
  }, [collect]);

  useEffect(
    function loadOnMount() {
      void load();
    },
    [load],
  );

  const setIncluded = useCallback(
    (id: SectionId, included: boolean) => {
      updateCard(id, { included });
    },
    [updateCard],
  );

  const setAllIncluded = useCallback((included: boolean) => {
    setCards((previous) => {
      const next = { ...previous };

      SECTION_IDS.forEach((id) => {
        next[id] = { ...previous[id], included };
      });

      return next;
    });
  }, []);

  const reload = useCallback(() => {
    void load();
  }, [load]);

  return {
    loading,
    listError,
    collectorVersion,
    cards,
    collect,
    setIncluded,
    setAllIncluded,
    reload,
  };
}
