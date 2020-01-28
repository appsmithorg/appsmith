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
  const WINDOW_BASE_URL: string = window.BASE_URL;
  const REACT_APP_BASE_URL: string | undefined = process.env.REACT_APP_BASE_URL;

  const BASE_URL =
    WINDOW_BASE_URL === "___BASE_URL___" ? REACT_APP_BASE_URL : WINDOW_BASE_URL;

  if (!BASE_URL) {
    throw Error("NO API Endpont defined - aborting");
  }
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
