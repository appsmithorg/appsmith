import { ANONYMOUS_USERNAME, type User } from "constants/userConstants";
import { getAppsmithConfigs } from "ee/configs";
import { isAirgapped } from "ee/utils/airgapHelpers";
import { sha256 } from "js-sha256";
import { getLicenseKey } from "ee/utils/licenseHelpers";

/** True when the Pylon loader ran, the app id is configured, and the instance is not airgapped. */
export function isPylonChatAvailable(): boolean {
  if (isAirgapped()) {
    return false;
  }

  const { pylonAppID } = getAppsmithConfigs();

  return Boolean(pylonAppID) && typeof window.Pylon === "function";
}

export default function bootPylon(user?: User) {
  if (!isPylonChatAvailable()) {
    return;
  }

  const { cloudHosting, pylonAppID } = getAppsmithConfigs();

  const email: string | undefined = user?.email;
  const username =
    user?.username === ANONYMOUS_USERNAME ? undefined : user?.username;
  const name: string | undefined = user?.name || username || email;

  const externalId = !cloudHosting && username ? sha256(username) : undefined;

  window.pylon = {
    chat_settings: {
      app_id: pylonAppID,
      email,
      name,
      ...(externalId ? { account_external_id: externalId } : {}),
    },
  };
}

export const updatePylonChatIdentity = (instanceId: string, user?: User) => {
  if (!isPylonChatAvailable()) {
    return;
  }

  const { appVersion, cloudHosting, pylonAppID } = getAppsmithConfigs();

  const email: string | undefined = user?.email;
  const username =
    user?.username === ANONYMOUS_USERNAME ? undefined : user?.username;
  const name: string | undefined = user?.name || username || email;

  // Preserve the boot-time account_external_id if already set; otherwise
  // compute it the same way bootPylon() does so consent refreshes don't
  // drop the original account linkage.
  const existingExternalId = window.pylon?.chat_settings?.account_external_id;
  const externalId =
    existingExternalId ||
    (!cloudHosting && username ? sha256(username) : undefined);

  window.pylon = {
    chat_settings: {
      ...(window.pylon?.chat_settings ?? {}),
      app_id: pylonAppID,
      email,
      name,
      ...(externalId ? { account_external_id: externalId } : {}),
    },
  };

  window.Pylon("setNewIssueCustomFields", {
    appsmith_version: `Appsmith ${
      !cloudHosting ? appVersion.edition : ""
    } ${appVersion.id}`,
    instance_id: instanceId,
    license_id: getLicenseKey() ?? "",
  });
};
