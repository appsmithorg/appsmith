import store from "store";
import { compose } from "@appsmith/utils";
import { getAppsmithConfigs } from "ee/configs";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { isAirgapped } from "ee/utils/airgapHelpers";
import type { InternalAxiosRequestConfig } from "axios";

import getQueryParamsObject from "utils/getQueryParamsObject";
import { addRequestedByHeader } from "./addRequestedByHeader";
import { increaseGitApiTimeout } from "./increaseGitApiTimeout";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import { addVersionHeader as _addVersionHeader } from "./addVersionHeader";
import { getCurrentEnvironmentId } from "ee/selectors/environmentSelectors";
import { addGitBranchHeader as _addGitBranchHeader } from "./addGitBranchHeader";
import { addPerformanceMonitoringHeaders } from "./addPerformanceMonitoringHeaders";
import { addEnvironmentHeader as _addEnvironmentHeader } from "./addEnvironmentHeader";
import { blockAirgappedRoutes as _blockAirgappedRoutes } from "./blockAirgappedRoutes";
import { addAnonymousUserIdHeader as _addAnonymousUserIdHeader } from "./addAnonymousUserIdHeader";

/**
 * Note: Why can't we use store.getState() or isGapgapped() directly in the interceptor?
 * The main reason is to easily test the interceptor. When we use store.getState() or isAirgapped() directly in the interceptor,
 * we need to mock the store or isAirgapped() in the test file and it becomes difficult and messy mocking things just to test the interceptor.
 */
const blockAirgappedRoutes = (config: InternalAxiosRequestConfig) => {
  const isAirgappedInstance = isAirgapped();

  return _blockAirgappedRoutes(config, { isAirgapped: isAirgappedInstance });
};

const addGitBranchHeader = (config: InternalAxiosRequestConfig) => {
  const state = store.getState();
  const branch = getCurrentGitBranch(state) || getQueryParamsObject().branch;

  return _addGitBranchHeader(config, { branch });
};

const addEnvironmentHeader = (config: InternalAxiosRequestConfig) => {
  const state = store.getState();
  const activeEnv = getCurrentEnvironmentId(state);

  return _addEnvironmentHeader(config, { env: activeEnv });
};

const addAnonymousUserIdHeader = (config: InternalAxiosRequestConfig) => {
  const appsmithConfig = getAppsmithConfigs();
  const anonymousId = AnalyticsUtil.getAnonymousId();
  const segmentEnabled = appsmithConfig.segment.enabled;

  return _addAnonymousUserIdHeader(config, { anonymousId, segmentEnabled });
};

const addVersionHeader = (config: InternalAxiosRequestConfig) => {
  const appsmithConfig = getAppsmithConfigs();
  const version = appsmithConfig.appVersion.id;

  return _addVersionHeader(config, { version });
};

export const apiRequestInterceptor = (config: InternalAxiosRequestConfig) => {
  const interceptorPipeline = compose<InternalAxiosRequestConfig>(
    blockAirgappedRoutes,
    addRequestedByHeader,
    addVersionHeader,
    addGitBranchHeader,
    increaseGitApiTimeout,
    addEnvironmentHeader,
    addAnonymousUserIdHeader,
    addPerformanceMonitoringHeaders,
  );

  return interceptorPipeline(config);
};
