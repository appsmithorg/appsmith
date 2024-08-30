import type { InternalAxiosRequestConfig } from "axios";
import { isAirgapped } from "ee/utils/airgapHelpers";
import { BLOCKED_ROUTES_REGEX } from "ee/api/constants";

const blockAirgappedRoutes = (request: InternalAxiosRequestConfig) => {
  const { url } = request;
  const isAirgappedInstance = isAirgapped();

  if (isAirgappedInstance && url && BLOCKED_ROUTES_REGEX.test(url)) {
    request.adapter = async (config) => {
      return new Promise((resolve) => {
        resolve({
          data: null,
          status: 200,
          statusText: "OK",
          headers: {},
          config,
          request,
        });
      });
    };
  }

  return request;
};

export { blockAirgappedRoutes };
