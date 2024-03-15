import SnapShotBannerCTA from "pages/Editor/CanvasLayoutConversion/SnapShotBannerCTA";
import React from "react";
import styled from "styled-components";
import MainContainerWrapper from "./MainContainerWrapper";
import OverlayCanvasContainer from "layoutSystems/common/WidgetNamesCanvas";
import { AppSettingsTabs } from "pages/Editor/AppSettingsPane/AppSettings";
import { useSelector } from "react-redux";
import {
  getCanvasWidth,
  getCurrentPageId,
  previewModeSelector,
} from "selectors/editorSelectors";
import { protectedModeSelector } from "selectors/gitSyncSelectors";
import { getSnapshotUpdatedTime } from "selectors/autoLayoutSelectors";
import { getReadableSnapShotDetails } from "layoutSystems/autolayout/utils/AutoLayoutUtils";
import {
  getAppSettingsPaneContext,
  getIsAppSettingsPaneWithNavigationTabOpen,
} from "selectors/appSettingsPaneSelectors";
import { useCurrentAppState } from "pages/Editor/IDE/hooks";
import { EditorState } from "@appsmith/entities/IDE/constants";
import {
  LayoutSystemFeatures,
  useLayoutSystemFeatures,
} from "layoutSystems/common/useLayoutSystemFeatures";

const BannerWrapper = styled.div`
  z-index: calc(var(--on-canvas-ui-z-index) + 1);
`;

/**
 * LayoutSystemBasedPageViewer
 *
 * This component is used to provide respective components based on the layout system features(ex: canvas overlay, snapshot banner).
 * It also provides the main container wrapper for the layout system based editor.
 */
export const LayoutSystemBasedPageViewer = ({
  navigationHeight,
}: {
  navigationHeight: number;
}) => {
  const currentPageId = useSelector(getCurrentPageId);
  const isPreviewMode = useSelector(previewModeSelector);
  const isProtectedMode = useSelector(protectedModeSelector);
  const lastUpdatedTime = useSelector(getSnapshotUpdatedTime);
  const readableSnapShotDetails = getReadableSnapShotDetails(lastUpdatedTime);
  const appSettingsPaneContext = useSelector(getAppSettingsPaneContext);
  const isNavigationSelectedInSettings = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const appState = useCurrentAppState();
  const isAppSettingsPaneWithNavigationTabOpen =
    appState === EditorState.SETTINGS && isNavigationSelectedInSettings;
  const canvasWidth = useSelector(getCanvasWidth);

  const isPreviewingNavigation =
    isPreviewMode || isProtectedMode || isAppSettingsPaneWithNavigationTabOpen;

  const shouldShowSnapShotBanner =
    !!readableSnapShotDetails && !isPreviewingNavigation;

  const checkLayoutSystemFeatures = useLayoutSystemFeatures();

  const [enableOverlayCanvas] = checkLayoutSystemFeatures([
    LayoutSystemFeatures.ENABLE_CANVAS_OVERLAY_FOR_EDITOR_UI,
  ]);

  return (
    <>
      {shouldShowSnapShotBanner && (
        <BannerWrapper className="absolute top-0 w-full">
          <SnapShotBannerCTA />
        </BannerWrapper>
      )}
      <MainContainerWrapper
        canvasWidth={canvasWidth}
        currentPageId={currentPageId}
        isAppSettingsPaneWithNavigationTabOpen={
          AppSettingsTabs.Navigation === appSettingsPaneContext?.type
        }
        isPreviewMode={isPreviewMode}
        isProtectedMode={isProtectedMode}
        navigationHeight={navigationHeight}
        shouldShowSnapShotBanner={shouldShowSnapShotBanner}
      />
      {enableOverlayCanvas && (
        <OverlayCanvasContainer canvasWidth={canvasWidth} />
      )}
    </>
  );
};
