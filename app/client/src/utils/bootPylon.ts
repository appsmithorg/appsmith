import { ANONYMOUS_USERNAME, type User } from "constants/userConstants";
import { getAppsmithConfigs } from "ee/configs";
import { isAirgapped } from "ee/utils/airgapHelpers";
import { getLicenseKey } from "ee/utils/licenseHelpers";

/** True when the Pylon loader ran, the app id is configured, and the instance is not airgapped. */
export function isPylonChatAvailable(): boolean {
  if (isAirgapped()) {
    return false;
  }

  const { pylonAppID } = getAppsmithConfigs();

  return Boolean(pylonAppID) && typeof window.Pylon === "function";
}

// Only inject the Pylon SDK <script> once, after window.pylon.chat_settings
// is fully populated. Pylon reads chat_settings at SDK init time and exposes
// no API to update identity post-init, so we must delay script loading until
// the authenticated user's email_hash is on window.pylon.
function injectPylonScriptOnce(appId: string) {
  const src = `https://widget.usepylon.com/widget/${appId}`;

  // Guard against duplicate injection (HMR, multiple boot callers, etc.) by
  // checking the DOM — two Pylon widgets on the same page would race and
  // duplicate chat sessions / messages.
  if (document.querySelector(`script[src="${src}"]`)) {
    return;
  }

  const script = document.createElement("script");

  script.type = "text/javascript";
  script.async = true;
  script.src = src;
  const firstScript = document.getElementsByTagName("script")[0];

  firstScript.parentNode?.insertBefore(script, firstScript);
}

export default function bootPylon(user?: User) {
  if (!isPylonChatAvailable()) {
    return;
  }

  const { pylonAppID } = getAppsmithConfigs();

  const email: string | undefined = user?.email;
  const username =
    user?.username === ANONYMOUS_USERNAME ? undefined : user?.username;
  const name: string | undefined = user?.name || username || email;

  const emailHash: string | undefined = user?.emailVerificationHash;

  // NOTE: account_external_id intentionally omitted. Pylon identity verification
  // hashes the email only; passing an unhashed external id alongside email_hash
  // causes /chatwidget/issue to return 401 "Identity verification required".
  window.pylon = {
    chat_settings: {
      app_id: pylonAppID,
      email,
      name,
      ...(emailHash ? { email_hash: emailHash } : {}),
    },
  };

  // Load the real Pylon SDK only once we have a verified identity on
  // chat_settings. Pylon reads chat_settings at SDK init time and has no API
  // to update identity afterwards, so skipping injection until email_hash is
  // present prevents the widget from booting in unverified mode and then
  // getting 401s on message send.
  if (emailHash) {
    injectPylonScriptOnce(pylonAppID);
  }
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

  // Preserve any boot-time email_hash if the refreshed user object doesn't carry
  // one (e.g. partial profile update), so identity verification survives across
  // consent refreshes.
  const existingEmailHash = window.pylon?.chat_settings?.email_hash;
  const emailHash: string | undefined =
    user?.emailVerificationHash || existingEmailHash;

  const sdkNotYetLoaded = !existingEmailHash && emailHash;

  // NOTE: account_external_id intentionally omitted. See bootPylon() above.
  window.pylon = {
    chat_settings: {
      app_id: pylonAppID,
      email,
      name,
      ...(emailHash ? { email_hash: emailHash } : {}),
    },
  };

  if (sdkNotYetLoaded) {
    injectPylonScriptOnce(pylonAppID);
  }

  window.Pylon("setNewIssueCustomFields", {
    appsmith_version: `Appsmith ${
      !cloudHosting ? appVersion.edition : ""
    } ${appVersion.id}`,
    instance_id: instanceId,
    license_id: getLicenseKey() ?? "",
  });
};
