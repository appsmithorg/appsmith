import type Smartlook from "smartlook-client";
import { getAppsmithConfigs } from "ee/configs";
import log from "loglevel";

class SmartlookUtil {
  private static smartlook: typeof Smartlook | null;

  public static async init() {
    const {
      smartLook: { enabled, id },
    } = getAppsmithConfigs();

    if (this.smartlook) {
      log.warn("Smartlook is already initialised.");

      return;
    }

    if (enabled) {
      try {
        const { default: loadedSmartlook } = await import("smartlook-client");

        // Sometimes smartlook could have been already initialized internally by
        // the time this function is called
        if (loadedSmartlook.initialized()) {
          loadedSmartlook.init(id);
        }

        this.smartlook = loadedSmartlook;
      } catch (e) {
        log.error("Failed to initialize Smartlook:", e);
      }
    }
  }

  public static identify(userId: string, email: string) {
    if (this.smartlook) {
      this.smartlook.identify(userId, {
        email,
      });
    }
  }

  public static identifyUser(userId: string, email: string) {
    if (this.initialised) {
      smartlookClient.identify(userId, {
        email,
      });
    }
  }
}

export default SmartlookUtil;
