import React, { useEffect } from "react";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useDynamicAppLayout } from "utils/hooks/useDynamicAppLayout";
import type { CanvasWidgetStructure } from "WidgetProvider/constants";
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
import { renderAppsmithCanvas } from "layoutSystems/CanvasFactory";
import type { WidgetProps } from "widgets/BaseWidget";
import { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";

interface AppPageProps {
  appName?: string;
  canvasWidth: number;
  pageId?: string;
  pageName?: string;
  widgetsStructure: CanvasWidgetStructure;
}

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
  const layoutSystemType: LayoutSystemTypes = useSelector(getLayoutSystemType);

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
          renderAppsmithCanvas({
            ...props.widgetsStructure,
            classList:
              layoutSystemType === LayoutSystemTypes.ANVIL
                ? ["main-anvil-canvas"]
                : [],
          } as WidgetProps)}
      </PageView>
    </PageViewWrapper>
  );
}

export default AppPage;
