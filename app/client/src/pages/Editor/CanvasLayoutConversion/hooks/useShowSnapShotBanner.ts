import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { EditorState } from "IDE/enums";
import { getReadableSnapShotDetails } from "layoutSystems/autolayout/utils/AutoLayoutUtils";
import { useCurrentAppState } from "pages/Editor/IDE/hooks/useCurrentAppState";
import { useSelector } from "react-redux";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { getSnapshotUpdatedTime } from "selectors/autoLayoutSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

/**
 * This hook is used to determine whether to show the snapshot banner.
 * It checks if the conversion flow is enabled, if there is a last updated time for the snapshot,
 * if the app state is in the settings and a navigation tab is selected,
 * and if the user is previewing the navigation or in preview mode.
 *
 * @param {boolean} isPreviewMode - Indicates whether the user is in preview mode
 * @returns {boolean} - Indicates whether to show the snapshot banner
 */
export const useShowSnapShotBanner = (isPreviewMode: boolean) => {
  const isConversionFlowEnabled = useFeatureFlag(
    FEATURE_FLAG.release_layout_conversion_enabled,
  );
  const lastUpdatedTime = useSelector(getSnapshotUpdatedTime);
  const readableSnapShotDetails = getReadableSnapShotDetails(lastUpdatedTime);
  const isNavigationSelectedInSettings = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );

  const appState = useCurrentAppState();
  const isAppSettingsPaneWithNavigationTabOpen =
    appState === EditorState.SETTINGS && isNavigationSelectedInSettings;

  const isPreviewingNavigation =
    isPreviewMode || isAppSettingsPaneWithNavigationTabOpen;

  const shouldShowSnapShotBanner =
    isConversionFlowEnabled &&
    !!readableSnapShotDetails &&
    !isPreviewingNavigation;

  return shouldShowSnapShotBanner;
};
