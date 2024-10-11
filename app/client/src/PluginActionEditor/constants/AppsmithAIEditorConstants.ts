import { DEFAULT_APPSMITH_AI_QUERY_TIMEOUT_MS } from "ee/constants/ApiConstants";
import type { ActionConfig } from "../../entities/Action";

// Appsmith AI Default Config
export const DEFAULT_APPSMITH_AI_ACTION_CONFIG: ActionConfig = {
  timeoutInMillisecond: DEFAULT_APPSMITH_AI_QUERY_TIMEOUT_MS,
  formData: {
    usecase: { data: "TEXT_GENERATE" },
  },
};
export const DEFAULT_CREATE_APPSMITH_AI_CONFIG = {
  config: DEFAULT_APPSMITH_AI_ACTION_CONFIG,
  datasource: {
    name: "DEFAULT_APPSMITH_AI_DATASOURCE",
    datasourceConfiguration: {},
  },
  eventData: {
    actionType: "APPSMITH_AI",
  },
};
