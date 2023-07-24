import { getAppsmithConfigs } from "ce/configs";

/*
 *  This will get defined somewhere in the platform
 */
window.appsmith = {
  configs: getAppsmithConfigs(),
  featureFlags: {
    someFeatureFlagFromFlagSmith: true,
  },
};

/*
 * Using the decorators to hide the global object from the widgets
 * And this will also allow us to change how we are getting the configs
 * without touching the code.
 */
export function platformConfigs(config: string) {
  return function (obj: any, property: string) {
    Object.defineProperty(obj, property, {
      get() {
        return window.appsmith.configs[config];
      },
    });
  };
}

export function featureFlags(flag: string) {
  return function (obj: any, property: string) {
    Object.defineProperty(obj, property, {
      get() {
        return window.appsmith.featureFlags[flag];
      },
    });
  };
}
