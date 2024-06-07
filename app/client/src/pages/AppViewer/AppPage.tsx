import React, { useEffect, useMemo } from "react";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { useDynamicAppLayout } from "utils/hooks/useDynamicAppLayout";
import type { CanvasWidgetStructure } from "WidgetProvider/constants";
import { useSelector } from "react-redux";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { PageView, PageViewWrapper } from "./AppPage.styled";
import { APP_MODE } from "entities/App";
import { renderAppsmithCanvas } from "layoutSystems/CanvasFactory";
import type { WidgetProps } from "widgets/BaseWidget";
import { useAppViewerSidebarProperties } from "utils/hooks/useAppViewerSidebarProperties";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";

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
  const isAnvilLayout = useSelector(getIsAnvilLayout);
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
