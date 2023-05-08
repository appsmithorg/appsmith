import type { User } from "constants/userConstants";
import { getAppsmithConfigs } from "@appsmith/configs";
import { sha256 } from "js-sha256";

const { appVersion, cloudHosting, intercomAppID } = getAppsmithConfigs();

export default function bootIntercom(user?: User) {
  if (intercomAppID && window.Intercom) {
    let { email, username } = user || {};
    let name;
    if (!cloudHosting) {
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
      "License ID": "3rd license",
    });
  }
};
