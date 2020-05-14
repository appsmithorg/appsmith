import prodConfig from "./prod.config";
import stageConfig from "./stage.config";
import devConfig from "./dev.config";
import { AppsmithUIConfigs } from "./types";
declare global {
  interface Window {
    BASE_URL: string;
  }
}

// TODO(Abhinav): See if this is called so many times, that we may need memoization.
export const getAppsmithConfigs = (): AppsmithUIConfigs => {
  const BASE_URL = "";
  switch (process.env.REACT_APP_ENVIRONMENT) {
    case "PRODUCTION":
      return prodConfig(BASE_URL);
    case "STAGING":
      return stageConfig(BASE_URL);
    case "DEVELOPMENT":
      return devConfig(BASE_URL);
    default:
      console.log(
        "Unknown environment set: ",
        process.env.REACT_APP_ENVIRONMENT,
      );
      return devConfig(BASE_URL);
  }
};
