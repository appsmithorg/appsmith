import { AppsmithUIConfigs } from "./types";
import stageConfig from "./stage.config";

const autoConfig = (baseUrl: string): AppsmithUIConfigs => ({
  ...stageConfig(baseUrl),
  segment: {
    enabled: false,
    key: "NZALSCjsaxOIyprzITLz2yZwFzQynGt1",
  },
  featureFlag: {
    // remoteConfig: {
    //   optimizely: "PVDSYRhBhvUVY3tN6mkV1s",
    // },
    default: {
      lightningmenu: false,
    },
  },
});

export default autoConfig;
