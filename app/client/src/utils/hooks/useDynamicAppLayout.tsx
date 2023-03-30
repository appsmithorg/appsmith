import { debounce, get } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { updateLayoutForMobileBreakpointAction } from "actions/autoLayoutActions";
import { updateCanvasLayoutAction } from "actions/editorActions";
import { APP_SETTINGS_PANE_WIDTH } from "constants/AppConstants";
import {
  DefaultLayoutType,
  layoutConfigurations,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { APP_MODE } from "entities/App";
import { SIDE_NAV_WIDTH } from "pages/common/SideNav";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import {
  getCurrentApplicationLayout,
  getCurrentAppPositioningType,
  getCurrentPageId,
  getMainCanvasProps,
  previewModeSelector,
} from "selectors/editorSelectors";
import { getAppMode } from "selectors/entitiesSelector";
import {
  getExplorerPinned,
  getExplorerWidth,
} from "selectors/explorerSelector";
import { getIsCanvasInitialized } from "selectors/mainCanvasSelectors";
import {
  getIsAppSettingsPaneOpen,
  getIsAppSettingsPaneWithNavigationTabOpen,
} from "selectors/appSettingsPaneSelectors";
import {
  getPaneCount,
  getTabsPaneWidth,
  isMultiPaneActive,
} from "selectors/multiPaneSelectors";
import {
  getAppSidebarPinned,
  getCurrentApplication,
  getSidebarWidth,
} from "@appsmith/selectors/applicationSelectors";
import { useIsMobileDevice } from "./useDeviceDetect";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import { scrollbarWidth } from "utils/helpers";
import { useWindowSizeHooks } from "./dragResizeHooks";
import type { AppState } from "ce/reducers";

const BORDERS_WIDTH = 2;
const GUTTER_WIDTH = 72;
export const AUTOLAYOUT_RESIZER_WIDTH_BUFFER = 40;

export const useDynamicAppLayout = () => {
  const dispatch = useDispatch();
  const explorerWidth = useSelector(getExplorerWidth);
  const propertyPaneWidth = useSelector(getPropertyPaneWidth);
  const isExplorerPinned = useSelector(getExplorerPinned);
  const appMode: APP_MODE | undefined = useSelector(getAppMode);
  const { width: screenWidth } = useWindowSizeHooks();
  const mainCanvasProps = useSelector(getMainCanvasProps);
  const isPreviewMode = useSelector(previewModeSelector);
  const currentPageId = useSelector(getCurrentPageId);
  const isCanvasInitialized = useSelector(getIsCanvasInitialized);
  const appLayout = useSelector(getCurrentApplicationLayout);
  const isAppSettingsPaneOpen = useSelector(getIsAppSettingsPaneOpen);
  const tabsPaneWidth = useSelector(getTabsPaneWidth);
  const isMultiPane = useSelector(isMultiPaneActive);
  const paneCount = useSelector(getPaneCount);
  const appPositioningType = useSelector(getCurrentAppPositioningType);
  const isAppSidebarPinned = useSelector(getAppSidebarPinned);
  const sidebarWidth = useSelector(getSidebarWidth);
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const currentApplicationDetails = useSelector(getCurrentApplication);
  const isMobile = useIsMobileDevice();
  const isAutoCanvasResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );
  const [isCanvasResizing, setIsCanvasResizing] = useState<boolean>(false);

  // /**
  //  * calculates min height
  //  */
  // const calculatedMinHeight = useMemo(() => {
  //   return calculateDynamicHeight();
  // }, [mainCanvasProps]);

  /**
   * app layout range i.e minWidth and maxWidth for the current layout
   * if there is no config for the current layout, use default layout i.e desktop
   */
  const layoutWidthRange = useMemo(() => {
    let minWidth = -1;
    let maxWidth = -1;

    if (appLayout) {
      const { type } = appLayout;
      const currentLayoutConfig = get(
        layoutConfigurations,
        type,
        layoutConfigurations[DefaultLayoutType],
      );

      if (currentLayoutConfig.minWidth) minWidth = currentLayoutConfig.minWidth;
      if (currentLayoutConfig.maxWidth) maxWidth = currentLayoutConfig.maxWidth;
    }

    return { minWidth, maxWidth };
  }, [appLayout]);

  /**
   * calculate the width for the canvas
   *
   * cases:
   *  - if max width is negative, use calculated width
   *  - if calculated width is in range of min/max widths of layout, use calculated width
   *  - if calculated width is less then min width, use min Width
   *  - if calculated width is larger than max width, use max width
   *  - by default use min width
   *
   * @returns
   */
  const calculateCanvasWidth = () => {
    let { maxWidth } = layoutWidthRange;
    const { minWidth } = layoutWidthRange;
    let calculatedWidth = screenWidth - scrollbarWidth();

    const gutterWidth =
      appPositioningType === AppPositioningTypes.AUTO ? 0 : GUTTER_WIDTH;

    // if preview mode is not on and the app setting pane is not opened, we need to subtract the width of the property pane
    if (
      isPreviewMode === false &&
      !isAppSettingsPaneOpen &&
      appMode === APP_MODE.EDIT
    ) {
      calculatedWidth -= propertyPaneWidth;
    }

    // if app setting pane is open, we need to subtract the width of app setting page width
    if (isAppSettingsPaneOpen === true && appMode === APP_MODE.EDIT) {
      calculatedWidth -= APP_SETTINGS_PANE_WIDTH;
    }

    // if explorer is closed or its preview mode, we don't need to subtract the EE width
    if (
      isExplorerPinned === true &&
      !isPreviewMode &&
      appMode === APP_MODE.EDIT
    ) {
      calculatedWidth -= explorerWidth;
    }

    if (isMultiPane) {
      calculatedWidth = screenWidth - scrollbarWidth() - tabsPaneWidth - 100;
      if (paneCount === 3) calculatedWidth -= propertyPaneWidth;
    }

    /**
     * If there is
     * 1. a sidebar for navigation,
     * 2. it is pinned,
     * 3. and device is not mobile
     * we need to subtract the sidebar width as well in the following modes -
     * 1. Preview
     * 2. App settings open with navigation tab
     * 3. Published
     */
    if (
      (appMode === APP_MODE.PUBLISHED ||
        isPreviewMode ||
        isAppSettingsPaneWithNavigationTabOpen) &&
      !isMobile &&
      sidebarWidth
    ) {
      calculatedWidth -= sidebarWidth;
    }
    if (isMobile) {
      maxWidth += sidebarWidth;
    }
    const ele: any = document.getElementById("canvas-viewport");
    if (
      appMode === APP_MODE.EDIT &&
      appLayout?.type === "FLUID" &&
      ele &&
      calculatedWidth > ele.clientWidth
    ) {
      calculatedWidth = ele.clientWidth;
    }

    switch (true) {
      case maxWidth < 0:
      case appLayout?.type === "FLUID":
      case calculatedWidth < maxWidth && calculatedWidth > minWidth:
        const totalWidthToSubtract = BORDERS_WIDTH + gutterWidth;
        // NOTE: gutter + border width will be only substracted when theme mode and preview mode are off
        return (
          calculatedWidth -
          (appMode === APP_MODE.EDIT &&
          !isPreviewMode &&
          !isAppSettingsPaneWithNavigationTabOpen
            ? totalWidthToSubtract
            : 0)
        );
      case calculatedWidth < minWidth:
        return minWidth;
      case calculatedWidth > maxWidth:
        return maxWidth;
      default:
        return minWidth;
    }
  };

  /**
   * resizes the layout based on the layout type
   *
   * @param screenWidth
   * @param appLayout
   */
  const resizeToLayout = () => {
    const calculatedWidth = calculateCanvasWidth();
    const { width: rightColumn } = mainCanvasProps || {};
    let scale = 1;
    if (isMultiPane && appLayout?.type !== "FLUID") {
      let canvasSpace =
        screenWidth -
        tabsPaneWidth -
        SIDE_NAV_WIDTH -
        GUTTER_WIDTH -
        BORDERS_WIDTH;
      if (paneCount === 3) canvasSpace -= propertyPaneWidth;
      // Scale will always be between 0.5 to 1
      scale = Math.max(
        Math.min(+Math.abs(canvasSpace / calculatedWidth).toFixed(2), 1),
        0.5,
      );
      dispatch(updateCanvasLayoutAction(calculatedWidth, scale));
    } else if (rightColumn !== calculatedWidth || !isCanvasInitialized) {
      dispatch(updateCanvasLayoutAction(calculatedWidth, scale));
    }
  };

  const debouncedResize = useCallback(debounce(resizeToLayout, 250), [
    mainCanvasProps,
    screenWidth,
    tabsPaneWidth,
    paneCount,
  ]);

  const immediateDebouncedResize = useCallback(debounce(resizeToLayout), [
    mainCanvasProps,
    screenWidth,
    currentPageId,
    appMode,
    appLayout,
    isPreviewMode,
  ]);

  const resizeObserver = new ResizeObserver(immediateDebouncedResize);
  useEffect(() => {
    const ele: any = document.getElementById("canvas-viewport");
    if (ele) {
      if (appLayout?.type === "FLUID") {
        resizeObserver.observe(ele);
      } else {
        resizeObserver.unobserve(ele);
      }
    }
    return () => {
      ele && resizeObserver.unobserve(ele);
    };
  }, [appLayout, currentPageId, isPreviewMode]);

  /**
   * when screen height is changed, update canvas layout
   */
  // useEffect(() => {
  //   if (calculatedMinHeight !== mainCanvasProps?.height) {
  //     // dispatch(updateCanvasLayoutAction(mainCanvasProps?.width));
  //   }
  // }, [screenHeight, mainCanvasProps?.height]);

  useEffect(() => {
    if (isCanvasInitialized) debouncedResize();
  }, [screenWidth, tabsPaneWidth, paneCount]);

  /**
   * resize the layout if any of the following thing changes:
   *  - app layout
   *  - page
   *  - container right column
   *  - preview mode
   *  - explorer width
   *  - explorer is pinned
   *  - theme mode is turned on
   *  - sidebar pin/unpin
   *  - app settings pane open with navigation tab
   *  - any of the following navigation settings changes
   *    - orientation
   *    - nav style
   *  - device changes to/from mobile
   */
  useEffect(() => {
    resizeToLayout();
  }, [
    appLayout,
    mainCanvasProps?.width,
    isPreviewMode,
    isAppSettingsPaneWithNavigationTabOpen,
    explorerWidth,
    sidebarWidth,
    propertyPaneWidth,
    isExplorerPinned,
    propertyPaneWidth,
    isAppSettingsPaneOpen,
    isAppSidebarPinned,
    currentApplicationDetails?.applicationDetail?.navigationSetting
      ?.orientation,
    currentApplicationDetails?.applicationDetail?.navigationSetting?.navStyle,
    isMobile,
    currentPageId, //TODO: preet - remove this after first merge.
  ]);

  useEffect(() => {
    dispatch(
      updateLayoutForMobileBreakpointAction(
        MAIN_CONTAINER_WIDGET_ID,
        appPositioningType === AppPositioningTypes.AUTO
          ? mainCanvasProps?.isMobile
          : false,
        calculateCanvasWidth(),
      ),
    );
  }, [mainCanvasProps?.isMobile]);

  useEffect(() => {
    if (isAutoCanvasResizing) setIsCanvasResizing(true);
    else if (isCanvasResizing) {
      setIsCanvasResizing(false);
      dispatch(
        updateLayoutForMobileBreakpointAction(
          MAIN_CONTAINER_WIDGET_ID,
          appPositioningType === AppPositioningTypes.AUTO
            ? mainCanvasProps?.isMobile
            : false,
          calculateCanvasWidth(),
        ),
      );
    }
  }, [isAutoCanvasResizing]);

  return isCanvasInitialized;
};
