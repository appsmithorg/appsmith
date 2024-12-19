import { getAppsmithConfigs } from "ee/configs";
import TrackedUser from "ee/utils/Analytics/trackedUser";
import { noop } from "lodash";

let instanceId = "";

function initLicense() {
  return noop();
}

function initInstanceId(id: string) {
  instanceId = id;
}

function getInstanceId() {
  return instanceId;
}

function getEventExtraProperties() {
  const { appVersion } = getAppsmithConfigs();
  let userData;

  try {
    userData = TrackedUser.getInstance().getUser();
  } catch (e) {
    userData = {};
  }

  return {
    instanceId,
    version: appVersion.id,
    userData,
  };
}

export { getEventExtraProperties, initInstanceId, getInstanceId, initLicense };
