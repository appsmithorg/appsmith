export * from "../../ce/utils/serviceWorkerUtils";

import { APP_MODE } from "entities/App";
import type { TApplicationParams } from "../../ce/utils/serviceWorkerUtils";

export const getPrefetchModuleApiRequests = (
  applicationProps: TApplicationParams,
): Request[] => {
  const prefetchRequests: Request[] = [];
  const { appMode, branchName, origin, pageId } = applicationProps;

  if (!pageId) {
    return prefetchRequests;
  }

  const searchParams = new URLSearchParams();

  searchParams.append("contextId", pageId);
  searchParams.append("contextType", "PAGE");
  searchParams.append("viewMode", (appMode === APP_MODE.PUBLISHED).toString());

  const headers = new Headers();

  if (branchName) {
    headers.append("Branchname", branchName);
  }

  const moduleInstanceUrl = `${origin}/api/v1/moduleInstances?${searchParams.toString()}`;
  const moduleInstanceRequest = new Request(moduleInstanceUrl, {
    method: "GET",
    headers,
  });
  prefetchRequests.push(moduleInstanceRequest);

  // Add module entities api
  const moduleEntitiesUrl = `${origin}/api/v1/moduleInstances/entities?${searchParams.toString()}`;
  const moduleEntitiesRequest = new Request(moduleEntitiesUrl, {
    method: "GET",
    headers,
  });
  prefetchRequests.push(moduleEntitiesRequest);

  return prefetchRequests;
};
