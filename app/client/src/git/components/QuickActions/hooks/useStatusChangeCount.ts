import type { FetchStatusResponseData } from "git/requests/fetchStatusRequest.types";
import { useMemo } from "react";

// does not include modules or moduleinstances
export const calcStatusChangeCount = (status: FetchStatusResponseData) => {
  const {
    modified = [],
    modifiedDatasources = 0,
    modifiedJSLibs = 0,
    modifiedJSObjects = 0,
    modifiedModuleInstances = 0,
    modifiedPages = 0,
    modifiedQueries = 0,
    modifiedSourceModules = 0,
  } = status || {};
  const themeCount = modified.includes("theme.json") ? 1 : 0;
  const settingsCount = modified.includes("application.json") ? 1 : 0;

  // does not include ahead and behind remote counts
  return (
    modifiedDatasources +
    modifiedJSLibs +
    modifiedJSObjects +
    modifiedPages +
    modifiedQueries +
    themeCount +
    modifiedSourceModules +
    modifiedModuleInstances +
    settingsCount
  );
};

export default function useStatusChangeCount(
  status: FetchStatusResponseData | null,
) {
  const statusChangeCount = useMemo(
    () => (status ? calcStatusChangeCount(status) : 0),
    [status],
  );

  return statusChangeCount;
}
