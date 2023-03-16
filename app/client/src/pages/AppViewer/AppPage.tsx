import React, { useEffect } from "react";
import WidgetFactory from "utils/WidgetFactory";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useDynamicAppLayout } from "utils/hooks/useDynamicAppLayout";
import type { CanvasWidgetStructure } from "widgets/constants";
import { RenderModes } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import {
  getCurrentApplication,
  getAppSidebarPinned,
  getSidebarWidth,
} from "selectors/applicationSelectors";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { PageView, PageViewContainer } from "./AppPage.styled";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";

type AppPageProps = {
  appName?: string;
  canvasWidth: number;
  pageId?: string;
  pageName?: string;
  widgetsStructure: CanvasWidgetStructure;
};

export function AppPage(props: AppPageProps) {
  const currentApplicationDetails = useSelector(getCurrentApplication);
  const isAppSidebarPinned = useSelector(getAppSidebarPinned);
  const sidebarWidth = useSelector(getSidebarWidth);
  const isMobile = useIsMobileDevice();

  useDynamicAppLayout();

  useEffect(() => {
    AnalyticsUtil.logEvent("PAGE_LOAD", {
      pageName: props.pageName,
      pageId: props.pageId,
      appName: props.appName,
      mode: "VIEW",
    });
  }, [props.pageId, props.pageName]);

  return (
    <PageViewContainer
      hasPinnedSidebar={
        currentApplicationDetails?.navigationSetting?.orientation ===
          NAVIGATION_SETTINGS.ORIENTATION.SIDE && isAppSidebarPinned
      }
      sidebarWidth={isMobile ? 0 : sidebarWidth}
    >
      <PageView className="t--app-viewer-page" width={props.canvasWidth}>
        {props.widgetsStructure.widgetId &&
          WidgetFactory.createWidget(props.widgetsStructure, RenderModes.PAGE)}
      </PageView>
    </PageViewContainer>
  );
}

export default AppPage;
