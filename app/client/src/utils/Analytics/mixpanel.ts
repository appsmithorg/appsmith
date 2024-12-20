import log from "loglevel";
import type { OverridedMixpanel } from "mixpanel-browser";
import { getAppsmithConfigs } from "ee/configs";
import SegmentSingleton from "./segment";
import type { ID } from "@segment/analytics-next";

export interface SessionRecordingConfig {
  enabled: boolean;
  mask: boolean;
}

class MixpanelSingleton {
  private static instance: MixpanelSingleton;
  private mixpanel: OverridedMixpanel | null = null;

  public static getInstance(): MixpanelSingleton {
    if (!MixpanelSingleton.instance) {
      MixpanelSingleton.instance = new MixpanelSingleton();
    }

    return MixpanelSingleton.instance;
  }

  // Segment needs to be initialized before Mixpanel
  public async init({
    enabled,
    mask,
  }: SessionRecordingConfig): Promise<boolean> {
    if (this.mixpanel) {
      log.warn("Mixpanel is already initialized.");

      return true;
    }

    // Do not initialize Mixpanel if session recording is disabled
    if (!enabled) {
      return false;
    }

    try {
      const { default: loadedMixpanel } = await import("mixpanel-browser");
      const { mixpanel } = getAppsmithConfigs();

      if (mixpanel.enabled) {
        this.mixpanel = loadedMixpanel;
        this.mixpanel.init(mixpanel.apiKey, {
          record_sessions_percent: 100,
          record_block_selector: mask ? ".mp-block" : "",
          record_mask_text_selector: mask ? ".mp-mask" : "",
        });

        await this.addSegmentMiddleware();
      }

      return true;
    } catch (error) {
      log.error("Failed to initialize Mixpanel:", error);

      return false;
    }
  }

  public startRecording() {
    if (this.mixpanel) {
      this.mixpanel.start_session_recording();
    }
  }

  public stopRecording() {
    if (this.mixpanel) {
      this.mixpanel.stop_session_recording();
    }
  }

  private registerDevice(token: string) {
    if (this.mixpanel) {
      this.mixpanel.register({ $device_id: token, distinct_id: token });
    } else {
      log.warn("Mixpanel is not initialized.");
    }
  }

  private identify(userId: ID) {
    if (!userId) {
      log.warn("Mixpanel identify was called without userId.");

      return;
    }

    if (this.mixpanel) {
      this.mixpanel.identify(userId);
    } else {
      log.warn("Mixpanel is not initialized.");
    }
  }

  private getSessionRecordingProperties() {
    if (this.mixpanel) {
      return this.mixpanel.get_session_recording_properties();
    } else {
      log.warn("Mixpanel is not initialized.");

      return {};
    }
  }

  // Middleware to add Mixpanel's session recording properties to Segment events
  // https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/middleware/
  // https://docs.mixpanel.com/docs/session-replay/session-replay-web#segment-analyticsjs
  private async addSegmentMiddleware() {
    if (this.mixpanel) {
      await SegmentSingleton.getInstance().addMiddleware((middleware) => {
        if (
          middleware.payload.obj.type === "track" ||
          middleware.payload.obj.type === "page"
        ) {
          const segmentDeviceId = middleware.payload.obj.anonymousId;

          //original id
          if (segmentDeviceId) {
            this.registerDevice(segmentDeviceId);
          }

          const sessionReplayProperties = this.getSessionRecordingProperties();

          // Add session recording properties to the event
          middleware.payload.obj.properties = {
            ...middleware.payload.obj.properties,
            ...sessionReplayProperties,
          };
        }

        if (middleware.payload.obj.type === "identify") {
          const userId = middleware.payload.obj.userId;

          this.identify(userId);
        }

        middleware.next(middleware.payload);
      });
    } else {
      log.warn("Mixpanel is not initialized.");
    }
  }
}

export default MixpanelSingleton;
