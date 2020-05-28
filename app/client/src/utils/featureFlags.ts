import { FeatureFlagConfig, FeatureFlagsEnum } from "configs/types";
const optimizelySDK = require("@optimizely/optimizely-sdk");

class FeatureFlag {
  static isInitialized = false;
  static remote = undefined;
  static initialize(featureFlagConfig: FeatureFlagConfig) {
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
      });
      (FeatureFlag.remote as any).onReady().then(onInit);
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
  localStorage.setItem(
    FeatureFlagsEnum.DatasourcePane,
    optimizelyClientInstance.isFeatureEnabled(
      FeatureFlagsEnum.DatasourcePane,
      userId,
      {
        email: email,
      },
    ),
  );

  localStorage.setItem(
    FeatureFlagsEnum.ApiPaneV2,
    optimizelyClientInstance.isFeatureEnabled(
      FeatureFlagsEnum.ApiPaneV2,
      userId,
      {
        email: email,
      },
    ),
  );

  localStorage.setItem(
    FeatureFlagsEnum.documentationV2,
    optimizelyClientInstance.isFeatureEnabled(
      FeatureFlagsEnum.documentationV2,
      userId,
      {
        email: email,
      },
    ),
  );

  localStorage.setItem(
    FeatureFlagsEnum.QueryPane,
    optimizelyClientInstance.isFeatureEnabled(
      FeatureFlagsEnum.QueryPane,
      userId,
      {
        email: email,
      },
    ),
  );
}

export default FeatureFlag;
