import { AppsmithUIConfigs } from "./types";
import stageConfig from "./stage.config";

const autoConfig = (baseUrl: string): AppsmithUIConfigs => ({
  ...stageConfig(baseUrl),
  segment: {
    enabled: false,
    key: "NZALSCjsaxOIyprzITLz2yZwFzQynGt1",
  },
});

export default autoConfig;
