import { useSelector } from "react-redux";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { previewModeSelector } from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { getEnvironmentsWithPermission } from "ee/selectors/environmentSelectors";
import { showProductRamps } from "ee/selectors/rampSelectors";
import { RAMP_NAME } from "utils/ProductRamps/RampsControlList";
import type { AppState } from "ee/reducers";
import { areEnvironmentsFetched } from "ee/selectors/environmentSelectors";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import type { EnvironmentType } from "ee/configs/types";

export interface UseShowEnvSwitcherProps {
  viewMode: boolean;
}

function useShowEnvSwitcher({ viewMode }: UseShowEnvSwitcherProps): boolean {
  // 1. Check feature flag
  const isFeatureEnabled = useFeatureFlag(
    FEATURE_FLAG.release_datasource_environments_enabled,
  );

  // 2. Check preview mode
  const previewMode = useSelector(previewModeSelector);

  // 3. Check environment list and workspace
  const workspaceId = useSelector(getCurrentWorkspaceId) as string;
  const isLoaded = useSelector((state: AppState) =>
    areEnvironmentsFetched(state, workspaceId || ""),
  );
  const environmentList = useSelector(
    getEnvironmentsWithPermission,
  ) as EnvironmentType[];
  const isMultiEnvNotPresent =
    isLoaded &&
    (environmentList.length === 0 ||
      (environmentList.length === 1 && environmentList[0]?.isDefault));

  // 4. Check product ramp
  const isRampAllowed = useSelector(
    showProductRamps(RAMP_NAME.MULTIPLE_ENV, true),
  );

  // If feature is not enabled and ramp is not allowed, hide
  if (!isFeatureEnabled && !isRampAllowed) {
    return false;
  }

  // If in view mode and no valid environments, hide
  if (viewMode && isMultiEnvNotPresent) {
    return false;
  }

  // If in preview mode and no valid environments, hide
  if (previewMode && isMultiEnvNotPresent) {
    return false;
  }

  return true;
}

export default useShowEnvSwitcher;
