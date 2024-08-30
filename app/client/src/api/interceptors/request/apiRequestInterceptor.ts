import { compose } from "@appsmith/utils";
import type { InternalAxiosRequestConfig } from "axios";

import { addCsrfHeader } from "./addCsrfHeader";
import { blockAirgappedRoutes } from "./blockAirgappedRoutes";
import { addGitBranchHeader } from "./addGitBranchHeader";
import { increaseGitApiTimeout } from "./increaseGitApiTimeout";
import { addEnvironmentHeader } from "./addEnvironmentHeader";
import { addAnonymousUserIdHeader } from "./addAnonymousUserIdHeader";
import { addPerformanceMonitoringHeaders } from "./addPerformanceMonitoringHeaders";

export const apiRequestInterceptor = (config: InternalAxiosRequestConfig) => {
  config.headers = config.headers ?? {};

  const interceptorPipeline = compose<InternalAxiosRequestConfig>(
    blockAirgappedRoutes,
    addCsrfHeader,
    addGitBranchHeader,
    increaseGitApiTimeout,
    addEnvironmentHeader,
    addAnonymousUserIdHeader,
    addPerformanceMonitoringHeaders,
  );

  return interceptorPipeline(config);
};
