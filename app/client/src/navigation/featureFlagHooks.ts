import { useFeatureFlag } from "../utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";

export const useIsAppSidebarEnabled = () => {
  const isAppSidebarEnabled = useFeatureFlag(
    FEATURE_FLAG.release_app_sidebar_enabled,
  );

  const isAppSidebarRolloutEnabled = useFeatureFlag(
    FEATURE_FLAG.rollout_app_sidebar_enabled,
  );

  return isAppSidebarEnabled || isAppSidebarRolloutEnabled;
};
