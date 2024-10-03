import type { InternalAxiosRequestConfig } from "axios";
import { BLOCKED_ROUTES_REGEX } from "ee/constants/ApiConstants";

const blockAirgappedRoutes = (
  request: InternalAxiosRequestConfig,
  options: { isAirgapped: boolean },
) => {
  const { url } = request;
  const { isAirgapped } = options;

  if (isAirgapped && url && BLOCKED_ROUTES_REGEX.test(url)) {
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
