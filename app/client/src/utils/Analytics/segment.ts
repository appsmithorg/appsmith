import {
  type Analytics,
  type EventProperties,
  type MiddlewareFunction,
  type UserTraits,
} from "@segment/analytics-next";
import log from "loglevel";

class SegmentSingleton {
  private static instance: SegmentSingleton;
  private analytics: Analytics | null = null;

  public static getInstance(): SegmentSingleton {
    if (!SegmentSingleton.instance) {
      SegmentSingleton.instance = new SegmentSingleton();
    }

    return SegmentSingleton.instance;
  }

  public user = this.analytics?.user;

  public async init(writeKey: string): Promise<boolean> {
    if (this.analytics) {
      log.warn("Segment is already initialized.");

      return true;
    }

    try {
      const { AnalyticsBrowser } = await import("@segment/analytics-next");

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

      return true;
    } catch (error) {
      log.error("Failed to initialize Segment:", error);

      return false;
    }
  }

  public track(eventName: string, eventData: EventProperties) {
    if (this.analytics) {
      this.analytics.track(eventName, eventData);
    } else {
      log.warn("Segment is not initialized.");
    }
  }

  public identify(userId: string, traits: UserTraits) {
    if (this.analytics) {
      this.analytics.identify(userId, traits);
    } else {
      log.warn("Segment is not initialized.");
    }
  }

  public addMiddleware(middleware: MiddlewareFunction) {
    if (this.analytics) {
      this.analytics.addSourceMiddleware(middleware);
    } else {
      log.warn("Segment is not initialized.");
    }
  }

  public page(name?: string, properties?: EventProperties) {
    if (this.analytics) {
      this.analytics.page(name, properties);
    } else {
      log.warn("Segment is not initialized.");
    }
  }

  public reset() {
    if (this.analytics) {
      this.analytics.reset();
    } else {
      log.warn("Segment is not initialized.");
    }
  }
}

export default SegmentSingleton;
