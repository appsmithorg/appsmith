import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { AppState } from "ee/reducers";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";

export const getAgentChatQuery = () => {
  return undefined;
};

export const getIsAiAgentFlowEnabled = (state: AppState) => {
  return selectFeatureFlagCheck(state, FEATURE_FLAG.license_ai_agent_enabled);
};
