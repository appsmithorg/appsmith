import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

export default function useGitFeatureFlags() {
  const license_git_branch_protection_enabled = useFeatureFlag(
    FEATURE_FLAG.license_git_branch_protection_enabled,
  );
  const license_git_continuous_delivery_enabled = useFeatureFlag(
    FEATURE_FLAG.license_git_continuous_delivery_enabled,
  );

  return {
    license_git_branch_protection_enabled,
    license_git_continuous_delivery_enabled,
  };
}
