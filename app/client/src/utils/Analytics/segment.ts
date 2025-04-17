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

  public async init(): Promise<boolean> {
    const { segment } = getAppsmithConfigs();

    if (!segment.enabled) {
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

  public async identify(userId: string, traits: UserTraits) {
    if (this.analytics) {
      await this.analytics.identify(userId, traits);
    }
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
    if (this.analytics) {
      this.analytics.reset();
    }
  }
}

export default SegmentSingleton;
