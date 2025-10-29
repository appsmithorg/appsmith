import React, { useEffect, useMemo, useRef } from "react";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { CanvasWidgetStructure } from "WidgetProvider/types";
import { useSelector, useDispatch } from "react-redux";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { renderAppsmithCanvas } from "layoutSystems/CanvasFactory";
import type { WidgetProps } from "widgets/BaseWidget";
import { useAppViewerSidebarProperties } from "utils/hooks/useAppViewerSidebarProperties";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";
import { updateWindowDimensions } from "actions/windowActions";

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

  const dispatch = useDispatch();
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

  // Set up window resize listener for window dimensions
  useEffect(() => {
    const handleResize = () => {
      dispatch(updateWindowDimensions(window.innerHeight, window.innerWidth));
    };

    // Set initial dimensions immediately
    dispatch(updateWindowDimensions(window.innerHeight, window.innerWidth));

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [dispatch]);

  return (
    <PageViewWrapper
      hasPinnedSidebar={hasSidebarPinned}
      isPublished={isPublished}
      ref={pageViewWrapperRef}
      sidebarWidth={sidebarWidth}
    >
      <PageView
        className="as-mask"
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
