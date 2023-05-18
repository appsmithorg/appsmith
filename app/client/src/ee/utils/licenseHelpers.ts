export * from "ce/utils/licenseHelpers";
import store from "store";

export const getLicenseKey = () => {
  const state = store.getState();
  const licenseKey = state?.tenant?.tenantConfiguration?.license?.key;
  return licenseKey || "";
};
