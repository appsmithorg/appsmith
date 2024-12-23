import React, { useEffect, useMemo, useRef } from "react";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { CanvasWidgetStructure } from "WidgetProvider/constants";
import { useSelector } from "react-redux";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { renderAppsmithCanvas } from "layoutSystems/CanvasFactory";
import type { WidgetProps } from "widgets/BaseWidget";
import { useAppViewerSidebarProperties } from "utils/hooks/useAppViewerSidebarProperties";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";

import { PageView, PageViewWrapper } from "./AppPage.styled";
import { useCanvasWidthAutoResize } from "../../hooks/useCanvasWidthAutoResize";

interface AppPageProps {
  appName?: string;
  canvasWidth: number;
  basePageId?: string;
  pageName?: string;
  widgetsStructure: CanvasWidgetStructure;
}

export function AppPage(props: AppPageProps) {
  const { appName, basePageId, canvasWidth, pageName, widgetsStructure } =
    props;

  const appMode = useSelector(getAppMode);
  const isPublished = appMode === APP_MODE.PUBLISHED;
  const isAnvilLayout = useSelector(getIsAnvilLayout);
  const { hasSidebarPinned, sidebarWidth } = useAppViewerSidebarProperties();

  const width: string = useMemo(() => {
    return isAnvilLayout ? "100%" : `${canvasWidth}px`;
  }, [isAnvilLayout, canvasWidth]);

  const pageViewWrapperRef = useRef<HTMLDivElement>(null);

  useCanvasWidthAutoResize({ ref: pageViewWrapperRef });

  useEffect(() => {
    AnalyticsUtil.logEvent("PAGE_LOAD", {
      pageName: pageName,
      pageId: basePageId,
      appName: appName,
      mode: "VIEW",
    });
  }, [appName, basePageId, pageName]);

  return (
    <PageViewWrapper
      hasPinnedSidebar={hasSidebarPinned}
      isPublished={isPublished}
      ref={pageViewWrapperRef}
      sidebarWidth={sidebarWidth}
    >
      <PageView
        className="mp-mask"
        data-testid="t--app-viewer-page"
        width={width}
      >
        {widgetsStructure.widgetId &&
          renderAppsmithCanvas(widgetsStructure as WidgetProps)}
      </PageView>
    </PageViewWrapper>
  );
}

export default AppPage;
