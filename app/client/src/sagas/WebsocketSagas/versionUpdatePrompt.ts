import { toast } from "@appsmith/ads";
import {
  createMessage,
  INFO_VERSION_MISMATCH_FOUND_RELOAD_REQUEST,
} from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

function handleUpdateRequested(fromVersion: string, toVersion: string) {
  AnalyticsUtil.logEvent("VERSION_UPDATE_REQUESTED", {
    fromVersion,
    toVersion,
  });
  // Reload to fetch the latest app version
  location.reload();
}

export async function handleVersionMismatch(
  currentVersion: string,
  serverVersion: string,
) {
  // If no version is set, ignore
  if (!currentVersion) return;

  AnalyticsUtil.logEvent("VERSION_UPDATE_SHOWN", {
    fromVersion: currentVersion,
    toVersion: serverVersion,
  });

  toast.show(createMessage(INFO_VERSION_MISMATCH_FOUND_RELOAD_REQUEST), {
    kind: "info",
    autoClose: false,
    action: {
      text: "refresh",
      effect: () => handleUpdateRequested(currentVersion, serverVersion),
    },
  });
}
