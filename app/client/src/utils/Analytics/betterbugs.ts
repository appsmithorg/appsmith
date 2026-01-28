import type { User } from "constants/userConstants";
import { getAppsmithConfigs } from "ee/configs";
import log from "loglevel";
import store from "store";
import { getInstanceId } from "ee/selectors/organizationSelectors";
import { APPSMITH_BRAND_PRIMARY_COLOR } from "utils/BrandingUtils";

interface BetterbugsInstance {
  destroy?: () => void;
  show?: () => void;
  hide?: () => void;
  openWidget?: () => void;
  closeWidget?: () => void;
}

class BetterbugsUtil {
  private static instance: BetterbugsInstance | null;

  /**
   * Get default styling for BetterBugs widget (light theme)
   */
  private static getDefaultStyles() {
    return {
      theme: "light" as const,
      primaryColor: APPSMITH_BRAND_PRIMARY_COLOR,
      primaryTextColor: "#ffffff",
    };
  }

  public static async init(user?: User) {
    if (typeof window === "undefined") {
      return;
    }

    const { appVersion, betterbugs } = getAppsmithConfigs();
    const apiKey = betterbugs.apiKey;

    if (this.instance) {
      log.warn("BetterBugs is already initialised.");

      return;
    }

    if (!apiKey) {
      log.warn("BetterBugs API key not configured.");

      return;
    }

    try {
      const { default: Betterbugs } = await import("@betterbugs/web-sdk");
      const instance = new Betterbugs({
        apiKey,
        mode:
          process.env.NODE_ENV === "development" ? "development" : "production",
        ...(user?.email ? { email: user.email } : {}),
        showActionButton: false,
        styles: this.getDefaultStyles(),
        position: { bottom: "30px", right: "20px" },
        metaData: {
          ...(user?.email ? { user_email: user.email } : {}),
          ...(user?.name ? { user_name: user.name } : {}),
          instance_id: getInstanceId(store.getState()),
          tenant_id: store.getState().organization?.tenantId,
          version: appVersion.id,
          commit_sha: appVersion.sha,
          edition: appVersion.edition,
          release_date: appVersion.releaseDate,
        },
      });

      this.instance = instance as BetterbugsInstance;
    } catch (e) {
      log.error("Failed to initialize BetterBugs:", e);
    }
  }

  public static destroy() {
    try {
      this.instance?.destroy?.();
    } catch (e) {
      log.error("Failed to destroy BetterBugs:", e);
    } finally {
      this.instance = null;
    }
  }

  public static async show(user?: User) {
    // Destroy existing instance to clear previous state
    if (this.instance) {
      this.destroy();
    }

    // Initialize fresh instance
    await this.init(user);

    if (this.instance?.openWidget) {
      this.instance.openWidget();
    } else {
      log.warn("BetterBugs openWidget() is not available.");
    }
  }

  public static async hide() {
    if (!this.instance) {
      log.warn("BetterBugs instance not initialized.");

      return;
    }

    if (this.instance?.hide) {
      this.instance.hide();
    } else {
      log.warn("BetterBugs hide() is not available.");
    }
  }
}

export default BetterbugsUtil;
