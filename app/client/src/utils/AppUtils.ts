import { getAppsmithConfigs } from "ce/configs";
import FormControlRegistry from "./formControl/FormControlRegistry";
import { LogLevelDesc } from "loglevel";
import localStorage from "utils/localStorage";
import * as log from "loglevel";

export const appInitializer = () => {
  FormControlRegistry.registerFormControlBuilders();
  const appsmithConfigs = getAppsmithConfigs();
  log.setLevel(getEnvLogLevel(appsmithConfigs.logLevel));
};

const getEnvLogLevel = (configLevel: LogLevelDesc): LogLevelDesc => {
  let logLevel = configLevel;
  if (localStorage && localStorage.getItem) {
    const localStorageLevel = localStorage.getItem(
      "logLevelOverride",
    ) as LogLevelDesc;
    if (localStorageLevel) logLevel = localStorageLevel;
  }
  return logLevel;
};
