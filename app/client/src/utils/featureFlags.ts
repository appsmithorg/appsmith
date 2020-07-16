import { FeatureFlagConfig, FeatureFlagsEnum } from "configs/types";
const optimizelySDK = require("@optimizely/optimizely-sdk");

class FeatureFlag {
  static isInitialized = false;
  static remote = undefined;
  static initialize(featureFlagConfig?: FeatureFlagConfig) {
    if (featureFlagConfig) {
      Object.keys(featureFlagConfig.default).forEach((flag: any) => {
        // This is required because otherwise it will reset the values
        // every time the application is loaded. We need the application to load
        // remote values the second time.
        if (localStorage.getItem(flag) === null) {
          localStorage.setItem(
            flag,
            featureFlagConfig.default[flag as FeatureFlagsEnum].toString(),
          );
        }
      });

      if (featureFlagConfig.remoteConfig) {
        FeatureFlag.remote = optimizelySDK.createInstance({
          sdkKey: featureFlagConfig.remoteConfig.optimizely,
          datafileOptions: {
            autoUpdate: true,
            updateInterval: 600000, // 10 minutes in milliseconds
            urlTemplate: window.location.origin + "/f/datafiles/%s.json",
          },
        });
        (FeatureFlag.remote as any).onReady().then(onInit);
      }
    }
  }

  static identify(userData: any) {
    if (FeatureFlag.remote) {
      if (FeatureFlag.isInitialized) {
        updateFlagsInLocalStorage(userData);
      } else {
        (FeatureFlag.remote as any).onReady().then(() => {
          onInit();
          updateFlagsInLocalStorage(userData);
        });
      }
    }
  }

  static check(flagName: string) {
    return localStorage.getItem(flagName) === "true";
  }
}

function onInit() {
  FeatureFlag.isInitialized = true;
}

function updateFlagsInLocalStorage(userData: any) {
  const userId = userData.id;
  const email = userData.email;
  const optimizelyClientInstance = FeatureFlag.remote as any;

  Object.values(FeatureFlagsEnum).forEach((flag: string) => {
    localStorage.setItem(
      flag,
      optimizelyClientInstance.isFeatureEnabled(flag, userId, { email }),
    );
  });
}

export default FeatureFlag;
