import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  areEnvironmentsFetched,
  getEnvironmentsWithPermission,
} from "@appsmith/selectors/environmentSelectors";
import { showProductRamps } from "@appsmith/selectors/rampSelectors";
import { useSelector } from "react-redux";
import { RAMP_NAME } from "utils/ProductRamps/RampsControlList";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { previewModeSelector } from "selectors/editorSelectors";
import { getCurrentAppWorkspace } from "@appsmith/selectors/selectedWorkspaceSelectors";

const useShowEnvSwitcher = ({ viewMode }: { viewMode: boolean }) => {
  const isFeatureEnabled = useFeatureFlag(
    FEATURE_FLAG.release_datasource_environments_enabled,
  );
  const previewMode = useSelector(previewModeSelector);
  const isMultiEnvNotPresent = useSelector((state) => {
    const workspace = getCurrentAppWorkspace(state);
    const isLoaded = areEnvironmentsFetched(state, workspace?.id);
    const list = getEnvironmentsWithPermission(state);
    const isDefault = list?.[0]?.isDefault;
    if (!isFeatureEnabled) {
      return true;
    } else {
      return (
        isLoaded && (list.length === 0 || (list.length === 1 && isDefault))
      );
    }
  });

  const isRampAllowed = useSelector((state) =>
    showProductRamps(RAMP_NAME.MULTIPLE_ENV, true)(state),
  );
  if (!isFeatureEnabled && !isRampAllowed) {
    return false;
  }

  if (viewMode && isMultiEnvNotPresent) {
    return false;
  }

  if (previewMode && isMultiEnvNotPresent) {
    return false;
  }

  return true;
};

export default useShowEnvSwitcher;
