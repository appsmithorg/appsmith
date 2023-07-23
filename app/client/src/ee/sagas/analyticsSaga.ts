export * from "../../ce/sagas/analyticsSaga";

import { getAppsmithConfigs } from "@appsmith/configs";

export function getUserSource() {
  const { cloudHosting } = getAppsmithConfigs();
  const source = cloudHosting ? "cloud" : "ee";
  return source;
}
