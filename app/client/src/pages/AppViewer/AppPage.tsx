import React, { useEffect, useMemo, useRef } from "react";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import type { CanvasWidgetStructure } from "WidgetProvider/constants";
import { useDispatch, useSelector } from "react-redux";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { PageView, PageViewWrapper } from "./AppPage.styled";
import { APP_MODE } from "entities/App";
import { renderAppsmithCanvas } from "layoutSystems/CanvasFactory";
import type { WidgetProps } from "widgets/BaseWidget";
import { useAppViewerSidebarProperties } from "utils/hooks/useAppViewerSidebarProperties";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";
import { debounce } from "lodash";
import { updateCanvasLayoutAction } from "actions/editorActions";

interface AppPageProps {
  appName?: string;
  canvasWidth: number;
  pageId?: string;
  pageName?: string;
  widgetsStructure: CanvasWidgetStructure;
}

export function AppPage(props: AppPageProps) {
  const { appName, canvasWidth, pageId, pageName, widgetsStructure } = props;

  const dispatch = useDispatch();
  const appMode = useSelector(getAppMode);
  const isPublished = appMode === APP_MODE.PUBLISHED;
  const isAnvilLayout = useSelector(getIsAnvilLayout);
  const { hasSidebarPinned, sidebarWidth } = useAppViewerSidebarProperties();

  const width: string = useMemo(() => {
    return isAnvilLayout ? "100%" : `${canvasWidth}px`;
  }, [isAnvilLayout, canvasWidth]);

  const pageViewWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapperElement = pageViewWrapperRef.current;
    if (wrapperElement) {
      const debouncedResize = debounce(
        ([
          {
            contentRect: { width },
          },
        ]) => {
          dispatch(updateCanvasLayoutAction(width - sidebarWidth));
        },
        50,
      );

      const resizeObserver = new ResizeObserver(debouncedResize);

      resizeObserver.observe(wrapperElement);

      return () => {
        resizeObserver.unobserve(wrapperElement);
      };
    }
  }, [dispatch, sidebarWidth]);

  useEffect(() => {
    AnalyticsUtil.logEvent("PAGE_LOAD", {
      pageName: pageName,
      pageId: pageId,
      appName: appName,
      mode: "VIEW",
    });
  }, [appName, pageId, pageName]);

  return (
    <PageViewWrapper
      hasPinnedSidebar={hasSidebarPinned}
      isPublished={isPublished}
      ref={pageViewWrapperRef}
      sidebarWidth={sidebarWidth}
    >
      <PageView data-testid="t--app-viewer-page" width={width}>
        {widgetsStructure.widgetId &&
          renderAppsmithCanvas(widgetsStructure as WidgetProps)}
      </PageView>
    </PageViewWrapper>
  );
}

export default AppPage;
