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
import { debounce } from "lodash";
import { RESIZE_DEBOUNCE_THRESHOLD } from "pages/hooks/constants";

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

    // Create debounced version of resize handler
    const debouncedHandleResize = debounce(
      handleResize,
      RESIZE_DEBOUNCE_THRESHOLD * 2,
    );

    // Set initial dimensions immediately
    dispatch(updateWindowDimensions(window.innerHeight, window.innerWidth));

    // Add resize listener with debounced handler
    window.addEventListener("resize", debouncedHandleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", debouncedHandleResize);
      // Cancel any pending debounced calls
      debouncedHandleResize.cancel();
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
