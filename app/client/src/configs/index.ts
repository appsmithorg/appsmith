import prodConfig from "./prod.config";
import stageConfig from "./stage.config";
import devConfig from "./dev.config";
import { AppsmithUIConfigs } from "./types";

export const getAppsmithConfigs = (): AppsmithUIConfigs => {
  switch (process.env.REACT_APP_ENVIRONMENT) {
    case "PRODUCTION":
      return prodConfig;
    case "STAGING":
      return stageConfig;
    case "DEVELOPMENT":
      return devConfig;
    default:
      console.log(
        "Unknown environment set: ",
        process.env.REACT_APP_ENVIRONMENT,
      );
      devConfig.apiUrl = "";
      return devConfig;
  }
};
