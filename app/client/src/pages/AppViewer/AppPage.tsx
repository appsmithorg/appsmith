import React, { useEffect, useMemo } from "react";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useDynamicAppLayout } from "utils/hooks/useDynamicAppLayout";
import type { CanvasWidgetStructure } from "WidgetProvider/constants";
import { useSelector } from "react-redux";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { PageView, PageViewWrapper } from "./AppPage.styled";
import { APP_MODE } from "entities/App";
import { renderAppsmithCanvas } from "layoutSystems/CanvasFactory";
import type { WidgetProps } from "widgets/BaseWidget";
import { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import { useAppViewerSidebarProperties } from "utils/hooks/useAppViewerSidebarProperties";

interface AppPageProps {
  appName?: string;
  canvasWidth: number;
  pageId?: string;
  pageName?: string;
  widgetsStructure: CanvasWidgetStructure;
}

export function AppPage(props: AppPageProps) {
  const appMode = useSelector(getAppMode);
  const isPublished = appMode === APP_MODE.PUBLISHED;
  const layoutSystemType: LayoutSystemTypes = useSelector(getLayoutSystemType);
  const isAnvilLayout = layoutSystemType === LayoutSystemTypes.ANVIL;
  const { hasSidebarPinned, sidebarWidth } = useAppViewerSidebarProperties();

  const width: string = useMemo(() => {
    return isAnvilLayout ? "100%" : `${props.canvasWidth}px`;
  }, [isAnvilLayout, props.canvasWidth]);

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
      hasPinnedSidebar={hasSidebarPinned}
      isPublished={isPublished}
      sidebarWidth={sidebarWidth}
    >
      <PageView className="t--app-viewer-page" width={width}>
        {props.widgetsStructure.widgetId &&
          renderAppsmithCanvas(props.widgetsStructure as WidgetProps)}
      </PageView>
    </PageViewWrapper>
  );
}

export default AppPage;
