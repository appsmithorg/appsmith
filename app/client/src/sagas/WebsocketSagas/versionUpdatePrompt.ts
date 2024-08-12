// Check if user is updating the app when toast is shown
// Check how many times does the user see a toast before updating

import { toast } from "@appsmith/ads";
import {
  createMessage,
  INFO_VERSION_MISMATCH_FOUND_RELOAD_REQUEST,
} from "ee/constants/messages";
import type { AppVersionData } from "ee/configs/types";
import {
  getVersionUpdateState,
  removeVersionUpdateState,
  setVersionUpdateState,
} from "utils/storage";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

enum UpdateStateEvent {
  PROMPT_SHOWN = "PROMPT_SHOWN",
  UPDATE_REQUESTED = "UPDATE_REQUESTED",
}

export interface VersionUpdateState {
  currentVersion: string;
  upgradeVersion: string;
  timesShown: number;
  event: UpdateStateEvent;
}

let timesShown = 0;

function showPrompt(newUpdateState: VersionUpdateState) {
  toast.show(createMessage(INFO_VERSION_MISMATCH_FOUND_RELOAD_REQUEST), {
    kind: "info",
    autoClose: false,
    action: {
      text: "refresh",
      effect: () => handleUpdateRequested(newUpdateState),
    },
  });
}

function handleUpdateRequested(newUpdateState: VersionUpdateState) {
  // store version update with timesShown counter
  setVersionUpdateState({
    ...newUpdateState,
    event: UpdateStateEvent.UPDATE_REQUESTED,
  }).then(() => {
    AnalyticsUtil.logEvent("VERSION_UPDATE_REQUESTED", {
      fromVersion: newUpdateState.currentVersion,
      toVersion: newUpdateState.upgradeVersion,
      timesShown,
    });
    // Reload to fetch the latest app version
    location.reload();
  });
}

export async function handleVersionUpdate(
  currentVersionData: AppVersionData,
  serverVersion: string,
) {
  const { edition, id: currentVersion } = currentVersionData;
  // If no version is set, ignore
  if (!currentVersion) return;
  const versionState: VersionUpdateState | null = await getVersionUpdateState();
  if (currentVersion === serverVersion) {
    if (versionState) {
      AnalyticsUtil.logEvent("VERSION_UPDATE_SUCCESS", {
        fromVersion: versionState.currentVersion,
        toVersion: versionState.upgradeVersion,
        edition,
      });
      await removeVersionUpdateState();
    }
  }
  if (currentVersion !== serverVersion) {
    if (versionState) {
      timesShown = versionState.timesShown;
      if (
        currentVersion === versionState.currentVersion &&
        versionState.event === UpdateStateEvent.UPDATE_REQUESTED
      ) {
        AnalyticsUtil.logEvent("VERSION_UPDATED_FAILED", {
          fromVersion: versionState.currentVersion,
          toVersion: versionState.upgradeVersion,
          edition,
        });
      }
    }
    const newUpdateState: VersionUpdateState = {
      currentVersion,
      upgradeVersion: serverVersion,
      // Increment the timesShown counter
      timesShown: timesShown + 1,
      event: UpdateStateEvent.PROMPT_SHOWN,
    };
    AnalyticsUtil.logEvent("VERSION_UPDATE_SHOWN", {
      fromVersion: currentVersion,
      toVersion: serverVersion,
      timesShown,
    });
    showPrompt(newUpdateState);
  }
}
