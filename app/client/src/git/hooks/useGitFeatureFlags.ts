import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

export default function useGitFeatureFlags() {
  const license_git_branch_protection_enabled = useFeatureFlag(
    FEATURE_FLAG.license_git_branch_protection_enabled,
  );

  return {
    license_git_branch_protection_enabled,
  };
}
