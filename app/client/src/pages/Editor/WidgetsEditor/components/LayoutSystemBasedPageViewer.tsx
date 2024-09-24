import SnapShotBannerCTA from "pages/Editor/CanvasLayoutConversion/SnapShotBannerCTA";
import React from "react";
import { MainContainerWrapper } from "./MainContainerWrapper";
import { AppSettingsTabs } from "pages/Editor/AppSettingsPane/AppSettings";
import { useSelector } from "react-redux";
import {
  getCanvasWidth,
  getCurrentPageId,
  previewModeSelector,
} from "selectors/editorSelectors";
import { protectedModeSelector } from "selectors/gitSyncSelectors";
import { getAppSettingsPaneContext } from "selectors/appSettingsPaneSelectors";
import { useShowSnapShotBanner } from "pages/Editor/CanvasLayoutConversion/hooks/useShowSnapShotBanner";

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
  const appSettingsPaneContext = useSelector(getAppSettingsPaneContext);
  const canvasWidth = useSelector(getCanvasWidth);
  const shouldShowSnapShotBanner = useShowSnapShotBanner(
    isPreviewMode || isProtectedMode,
  );

  return (
    <>
      {shouldShowSnapShotBanner && <SnapShotBannerCTA />}
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
    </>
  );
};
