import { createSelector } from "reselect";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

export const selectGitApiContractsEnabled = createSelector(
  selectFeatureFlags,
  (featureFlags) =>
    featureFlags[FEATURE_FLAG.release_git_api_contracts_enabled] ?? false,
);
