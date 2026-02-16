import type { User } from "constants/userConstants";
import type {
  Betterbugs as BetterbugsInstance,
  BetterbugsOptions,
} from "@betterbugs/web-sdk";
import { getAppsmithConfigs } from "ee/configs";
import log from "loglevel";
import { APPSMITH_BRAND_PRIMARY_COLOR } from "utils/BrandingUtils";
import { isAirgapped } from "ee/utils/airgapHelpers";

export interface BetterbugsMetadata {
  instanceId: string;
  tenantId: string | undefined;
  applicationId: string | null;
  pageId: string | null;
}

const DEFAULT_BETTERBUGS_METADATA: BetterbugsMetadata = {
  instanceId: "",
  tenantId: undefined,
  applicationId: null,
  pageId: null,
};

class BetterbugsUtil {
  private static instance: BetterbugsInstance | null;

  private static getDefaultParams(
    user: User | undefined,
    apiKey: string,
    appVersion: ReturnType<typeof getAppsmithConfigs>["appVersion"],
    betterbugsMetadata: BetterbugsMetadata,
  ): BetterbugsOptions {
    const metadata: Record<string, string | null> = {
      instance_id: betterbugsMetadata.instanceId,
      tenant_id: betterbugsMetadata.tenantId || null,
      version: appVersion.id,
      commit_sha: appVersion.sha,
      edition: appVersion.edition,
      release_date: appVersion.releaseDate,
      ...this.getRuntimeMetadata(betterbugsMetadata),
    };

    const params: BetterbugsOptions = {
      apiKey,
      mode:
        process.env.NODE_ENV === "development" ? "development" : "production",
      showActionButton: false,
      styles: this.getDefaultStyles(),
      mainHeading: "Send support info",
      recordType: "recordVideo",
      position: { bottom: "30px", right: "20px" },
      successMessageHeaderText: "Information received",
      successMessageSubHeaderText:
        "Our support team will use it to review the issue",
      metaData: metadata,
    };

    if (user?.email) {
      params.email = user.email;
      metadata.user_email = user.email;
    }

    if (user?.name) {
      metadata.user_name = user.name;
    }

    return params;
  }

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

  private static getRuntimeMetadata(
    betterbugsMetadata: BetterbugsMetadata,
  ): Record<string, string | null> {
    if (typeof window === "undefined") {
      return {
        url_path: null,
        application_id: null,
        page_id: null,
      };
    }

    const urlPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    return {
      url_path: urlPath,
      application_id: betterbugsMetadata.applicationId || null,
      page_id: betterbugsMetadata.pageId || null,
    };
  }

  public static async init(
    user?: User,
    betterbugsMetadata?: BetterbugsMetadata,
  ) {
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

    const metadata = betterbugsMetadata || DEFAULT_BETTERBUGS_METADATA;

    try {
      const { default: Betterbugs } = await import("@betterbugs/web-sdk");
      const instance = new Betterbugs(
        this.getDefaultParams(user, apiKey, appVersion, metadata),
      );

      this.instance = instance;
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

  public static async show(
    user?: User,
    betterbugsMetadata?: BetterbugsMetadata,
  ) {
    if (isAirgapped() || !getAppsmithConfigs().betterbugs.enabled) {
      log.warn("BetterBugs is disabled.");

      return;
    }

    // Destroy existing instance to clear previous state
    if (this.instance) {
      this.destroy();
    }

    // Initialize fresh instance
    await this.init(user, betterbugsMetadata);

    this.updateMetadata(betterbugsMetadata);

    if (this.instance?.openWidget) {
      this.instance.openWidget();
    } else {
      log.warn("BetterBugs openWidget() is not available.");
    }
  }

  public static updateMetadata(betterbugsMetadata?: BetterbugsMetadata) {
    if (!this.instance) {
      return;
    }

    if (!this.instance.setMetadata) {
      return;
    }

    if (
      typeof window === "undefined" ||
      isAirgapped() ||
      !getAppsmithConfigs().betterbugs.enabled
    ) {
      return;
    }

    const metadata = betterbugsMetadata || DEFAULT_BETTERBUGS_METADATA;

    const existingMeta = this.instance.getMetadata?.() || {};
    const nextMeta = {
      ...existingMeta,
      ...this.getRuntimeMetadata(metadata),
    };

    this.instance.setMetadata(nextMeta);
  }

  public static hide() {
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
