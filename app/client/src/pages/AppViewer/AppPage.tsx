import React, { useEffect } from "react";
import WidgetFactory from "WidgetProvider/factory";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useDynamicAppLayout } from "utils/hooks/useDynamicAppLayout";
import type { CanvasWidgetStructure } from "WidgetProvider/constants";
import { RenderModes } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import {
  getCurrentApplication,
  getAppSidebarPinned,
  getSidebarWidth,
  getAppMode,
} from "@appsmith/selectors/applicationSelectors";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { PageView, PageViewWrapper } from "./AppPage.styled";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { APP_MODE } from "entities/App";
import { useLocation } from "react-router";

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
  const appMode = useSelector(getAppMode);
  const isPublished = appMode === APP_MODE.PUBLISHED;
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const isEmbed = queryParams.get("embed");
  const isNavbarVisibleInEmbeddedApp = queryParams.get("navbar");
  const isEmbeddedAppWithNavVisible = isEmbed && isNavbarVisibleInEmbeddedApp;

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
    <PageViewWrapper
      hasPinnedSidebar={
        currentApplicationDetails?.applicationDetail?.navigationSetting
          ?.orientation === NAVIGATION_SETTINGS.ORIENTATION.SIDE &&
        isAppSidebarPinned
      }
      isPublished={isPublished}
      sidebarWidth={
        isMobile || (isEmbed && !isEmbeddedAppWithNavVisible) ? 0 : sidebarWidth
      }
    >
      <PageView className="t--app-viewer-page" width={props.canvasWidth}>
        {props.widgetsStructure.widgetId &&
          WidgetFactory.createWidget(props.widgetsStructure, RenderModes.PAGE)}
      </PageView>
    </PageViewWrapper>
  );
}

export default AppPage;
