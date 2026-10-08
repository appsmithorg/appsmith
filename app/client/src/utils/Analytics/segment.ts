import {
  type Analytics,
  type EventProperties,
  type MiddlewareFunction,
  type UserTraits,
  AnalyticsBrowser,
} from "@segment/analytics-next";
import { getAppsmithConfigs } from "ee/configs";
import log from "loglevel";

enum InitializationStatus {
  WAITING = "waiting",
  INITIALIZED = "initialized",
  FAILED = "failed",
  NOT_REQUIRED = "not_required",
}

class SegmentSingleton {
  private static instance: SegmentSingleton;
  private analytics: Analytics | null = null;
  private eventQueue: Array<{ name: string; data: EventProperties }> = [];
  private initState: InitializationStatus = InitializationStatus.WAITING;
  private pendingIdentifies = new Map<string, Promise<void>>();
  // Bumped by reset(); an identify that was in flight across a reset belongs to the previous identity.
  private identifyGeneration = 0;

  public static getInstance(): SegmentSingleton {
    if (!SegmentSingleton.instance) {
      SegmentSingleton.instance = new SegmentSingleton();
    }

    return SegmentSingleton.instance;
  }

  public getUser() {
    if (this.analytics) {
      return this.analytics.user();
    }
  }

  private getWriteKey(): string | undefined {
    const { segment } = getAppsmithConfigs();

    // This value is only enabled for Appsmith's cloud hosted version. It is not set in self-hosted environments
    if (segment.apiKey) {
      return segment.apiKey;
    }

    // This value is set in self-hosted environments. But if the analytics are disabled, it's never used.
    if (segment.ceKey) {
      return segment.ceKey;
    }
  }

  public async init(shouldTrackUser: boolean): Promise<boolean> {
    const { segment } = getAppsmithConfigs();

    if (!segment.enabled) {
      this.avoidTracking();

      return true;
    }

    if (!shouldTrackUser) {
      this.avoidTracking();

      return true;
    }

    if (this.analytics) {
      log.warn("Segment is already initialized.");

      return true;
    }

    const writeKey = this.getWriteKey();

    if (!writeKey) {
      log.error("Segment key was not found.");
      this.avoidTracking();

      return true;
    }

    try {
      const [analytics] = await AnalyticsBrowser.load(
        { writeKey },
        {
          integrations: {
            "Segment.io": {
              deliveryStrategy: {
                strategy: "batching", // The delivery strategy used for sending events to Segment
                config: {
                  size: 100, // The batch size is the threshold that forces all batched events to be sent once it’s reached.
                  timeout: 1000, // The number of milliseconds that forces all events queued for batching to be sent, regardless of the batch size, once it’s reached
                },
              },
            },
          },
        },
      );

      this.analytics = analytics;
      this.initState = InitializationStatus.INITIALIZED;
      // Process queued events after successful initialization
      this.processEventQueue();

      return true;
    } catch (error) {
      log.error("Failed to initialize Segment:", error);
      // Clear the queue if error occurred in init
      this.flushEventQueue();
      this.initState = InitializationStatus.FAILED;

      return false;
    }
  }

  private processEventQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();

      if (event) {
        this.track(event.name, event.data);
      }
    }
  }

  private flushEventQueue() {
    this.eventQueue = [];
  }

  public track(eventName: string, eventData: EventProperties) {
    if (this.initState === InitializationStatus.WAITING) {
      // Only queue events if we're in WAITING state
      this.eventQueue.push({ name: eventName, data: eventData });
      log.debug("Event queued for later processing", eventName, eventData);
    }

    if (
      this.initState === InitializationStatus.NOT_REQUIRED ||
      !this.analytics
    ) {
      log.debug("Event fired locally", eventName, eventData);

      return;
    }

    log.debug("Event fired", eventName, eventData);
    this.analytics.track(eventName, eventData);
  }

  /**
   * Sends an identify call unless this browser session already identified the same user with the same traits.
   * analytics.js persists the user id across page loads itself, so repeating an unchanged identify on every
   * load only re-sends the same traits (and fans them out to every downstream tool) for nothing.
   */
  public async identify(userId: string, traits: UserTraits) {
    if (!this.analytics) {
      return;
    }

    const identity = JSON.stringify({ userId, traits });

    if (
      this.analytics.user()?.id?.() === userId &&
      readSessionValue(LAST_IDENTIFY_STORAGE_KEY) === identity
    ) {
      log.debug("Identify skipped, unchanged in this session", userId);

      return;
    }

    // Concurrent callers (e.g. initialize() and a Help button click) share one in-flight call.
    const inFlight = this.pendingIdentifies.get(identity);

    if (inFlight) {
      return inFlight;
    }

    const analytics = this.analytics;
    const generation = this.identifyGeneration;
    const pending = (async () => {
      try {
        await analytics.identify(userId, traits);

        // A reset() while this call was on the wire means it identified the previous session, not this one.
        if (this.identifyGeneration === generation) {
          writeSessionValue(LAST_IDENTIFY_STORAGE_KEY, identity);
        }
      } finally {
        // reset() already dropped this entry, and the key may now belong to a post-reset identify.
        if (this.identifyGeneration === generation) {
          this.pendingIdentifies.delete(identity);
        }
      }
    })();

    this.pendingIdentifies.set(identity, pending);

    return pending;
  }

  public async addMiddleware(middleware: MiddlewareFunction) {
    if (this.analytics) {
      await this.analytics.addSourceMiddleware(middleware);
    }
  }

  public avoidTracking() {
    this.initState = InitializationStatus.NOT_REQUIRED;
    this.flushEventQueue();
  }

  public reset() {
    // Invalidate identifies still in flight so the next sign-in identifies afresh instead of reusing them.
    this.identifyGeneration += 1;
    this.pendingIdentifies.clear();

    if (this.analytics) {
      this.analytics.reset();
    }

    writeSessionValue(LAST_IDENTIFY_STORAGE_KEY, null);
  }
}

const LAST_IDENTIFY_STORAGE_KEY = "appsmith:segment:lastIdentify";

// sessionStorage can be unavailable or throw (privacy modes, quota); identifying again is the safe fallback.
function readSessionValue(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionValue(key: string, value: string | null) {
  try {
    if (value === null) {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
    }
  } catch {
    // Nothing to do: the next identify simply goes out again.
  }
}

export default SegmentSingleton;
