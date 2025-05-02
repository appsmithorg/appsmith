import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { DefaultRootState } from "react-redux";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";

export const getAgentChatQuery = () => {
  return undefined;
};

export const getIsAiAgentFlowEnabled = (state: DefaultRootState) => {
  return selectFeatureFlagCheck(state, FEATURE_FLAG.license_ai_agent_enabled);
};
