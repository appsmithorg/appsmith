import { ANONYMOUS_USERNAME, type User } from "constants/userConstants";
import { getAppsmithConfigs } from "ee/configs";
import { sha256 } from "js-sha256";
import { getLicenseKey } from "ee/utils/licenseHelpers";

const { appVersion, cloudHosting, intercomAppID } = getAppsmithConfigs();

export default function bootIntercom(user?: User) {
  if (intercomAppID && window.Intercom) {
    let name: string | undefined = user?.name;
    let email: string | undefined = user?.email;
    let username =
      user?.username === ANONYMOUS_USERNAME ? undefined : user?.username;

    if (!cloudHosting && username) {
      // We are hiding their information when self-hosted
      username = sha256(username || "");
      // keep email undefined so that users are prompted to enter it when they reach out on intercom
      email = undefined;
    } else {
      name = user?.name;
    }

    window.Intercom("boot", {
      app_id: intercomAppID,
      user_id: username,
      email,
      // keep name undefined instead of an empty string so that intercom auto assigns a name
      name,
    });
  }
}
export const updateIntercomProperties = (instanceId: string, user?: User) => {
  if (intercomAppID && window.Intercom) {
    const { email } = user || {};

    window.Intercom("update", {
      email,
      "Appsmith version": `Appsmith ${
        !cloudHosting ? appVersion.edition : ""
      } ${appVersion.id}`,
      instanceId,
      "License ID": getLicenseKey(),
    });
  }
};
