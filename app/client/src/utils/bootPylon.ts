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
function injectPylonScriptOnce(appId: string, onReady?: () => void) {
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

  // Pylon defines window.Pylon during script execution, so onReady (fired on
  // the load event) is the earliest point custom fields can be attached. This
  // lets us set issue metadata once at SDK boot, so it applies to issues
  // created from ANY entry point — not just the Help-menu path that calls
  // updatePylonChatIdentity.
  if (onReady) {
    script.addEventListener("load", onReady);
  }

  const firstScript = document.getElementsByTagName("script")[0];

  firstScript.parentNode?.insertBefore(script, firstScript);
}

// Attach version/build/deployment metadata to every new Pylon issue. All values
// come from getAppsmithConfigs() (no user needed), so this can run at SDK boot
// to cover all entry points. instanceId is only available on the Help-menu path
// (updatePylonChatIdentity), so it is passed in there and omitted at boot.
//
// NOTE: each key below must exist as a matching custom-field *slug* in the
// Pylon dashboard, or Pylon silently drops the value (no client-side error).
// appsmith_edition intentionally duplicates the edition embedded in
// appsmith_version — the latter is a human-readable display string, the former
// a discrete, filterable field for support triage.
// Remember the instanceId once updatePylonChatIdentity has provided it, so a
// later boot-time call (e.g. if the SDK "load" handler runs after the Help-menu
// path) still carries instance_id. Pylon does not document whether
// setNewIssueCustomFields merges or replaces across calls, so we never rely on a
// prior call's instance_id surviving — we re-send it every time it is known.
let cachedInstanceId: string | undefined;

function setPylonNewIssueCustomFields(instanceId?: string) {
  if (instanceId) {
    cachedInstanceId = instanceId;
  }

  if (typeof window.Pylon !== "function") {
    return;
  }

  const { appVersion, cloudHosting } = getAppsmithConfigs();
  const effectiveInstanceId = instanceId ?? cachedInstanceId;

  window.Pylon("setNewIssueCustomFields", {
    appsmith_version: `Appsmith ${
      !cloudHosting ? appVersion.edition : ""
    } ${appVersion.id}`,
    appsmith_edition: appVersion.edition,
    build_sha: appVersion.sha,
    build_date: appVersion.releaseDate,
    deployment_type: cloudHosting ? "cloud" : "self-hosted",
    ...(effectiveInstanceId ? { instance_id: effectiveInstanceId } : {}),
    license_id: getLicenseKey() ?? "",
  });
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
    // Set issue metadata as soon as the SDK is ready so it covers issues
    // created from any entry point, not just the Help menu.
    injectPylonScriptOnce(pylonAppID, () => setPylonNewIssueCustomFields());
  }
}

export const updatePylonChatIdentity = (instanceId: string, user?: User) => {
  if (!isPylonChatAvailable()) {
    return;
  }

  const { pylonAppID } = getAppsmithConfigs();

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
    injectPylonScriptOnce(pylonAppID, () =>
      setPylonNewIssueCustomFields(instanceId),
    );
  }

  // On this path the SDK is already loaded (gated by isPylonChatAvailable), so
  // set the fields directly and include instance_id, which is only available
  // here.
  setPylonNewIssueCustomFields(instanceId);
};
