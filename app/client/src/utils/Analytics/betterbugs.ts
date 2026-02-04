import type { User } from "constants/userConstants";
import { getAppsmithConfigs } from "ee/configs";
import log from "loglevel";
import store from "store";
import { getInstanceId } from "ee/selectors/organizationSelectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { APPSMITH_BRAND_PRIMARY_COLOR } from "utils/BrandingUtils";
import { isAirgapped } from "ee/utils/airgapHelpers";

interface BetterbugsInstance {
  destroy?: () => void;
  show?: () => void;
  hide?: () => void;
  openWidget?: () => void;
  closeWidget?: () => void;
  getMetadata?: () => Record<string | number, string | number | null>;
  setMetadata?: (
    metaData: Record<string | number, string | number | null>,
  ) => void;
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

  private static getRuntimeMetadata(): Record<
    string | number,
    string | number | null
  > {
    if (typeof window === "undefined") {
      return {
        url_path: null,
        application_id: null,
        page_id: null,
      };
    }

    const state = store.getState();
    const applicationId = getCurrentApplicationId(state);
    const pageId = getCurrentPageId(state);
    const urlPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    return {
      url_path: urlPath,
      application_id: applicationId || null,
      page_id: pageId || null,
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

    if (!betterbugs.enabled || isAirgapped()) {
      log.warn("BetterBugs is disabled.");

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
        mainHeading: "Send support info",
        recordType: "domRecord",
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
          ...this.getRuntimeMetadata(),
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
    if (isAirgapped() || !getAppsmithConfigs().betterbugs.enabled) {
      log.warn("BetterBugs is disabled.");

      return;
    }

    // Destroy existing instance to clear previous state
    if (this.instance) {
      this.destroy();
    }

    // Initialize fresh instance
    await this.init(user);

    this.updateMetadata();

    if (this.instance?.openWidget) {
      this.instance.openWidget();
    } else {
      log.warn("BetterBugs openWidget() is not available.");
    }
  }

  public static updateMetadata() {
    if (!this.instance) {
      return;
    }

    if (!this.instance?.setMetadata) {
      return;
    }

    if (
      typeof window === "undefined" ||
      isAirgapped() ||
      !getAppsmithConfigs().betterbugs.enabled
    ) {
      return;
    }

    const existingMeta = this.instance.getMetadata?.() || {};
    const nextMeta = {
      ...existingMeta,
      ...this.getRuntimeMetadata(),
    };

    this.instance.setMetadata(nextMeta);
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
