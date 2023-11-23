import { debounce, get } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { updateLayoutForMobileBreakpointAction } from "actions/autoLayoutActions";
import { updateCanvasLayoutAction } from "actions/editorActions";
import {
  APP_SETTINGS_PANE_WIDTH,
  APP_SIDEBAR_WIDTH,
} from "constants/AppConstants";
import {
  DefaultLayoutType,
  layoutConfigurations,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { APP_MODE } from "entities/App";
import { LayoutSystemTypes } from "layoutSystems/types";
import {
  combinedPreviewModeSelector,
  getCurrentApplicationLayout,
  getCurrentPageId,
  getMainCanvasProps,
} from "selectors/editorSelectors";
import { getAppMode } from "@appsmith/selectors/entitiesSelector";
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
  getAppSidebarPinned,
  getCurrentApplication,
  getSidebarWidth,
} from "@appsmith/selectors/applicationSelectors";
import { useIsMobileDevice } from "./useDeviceDetect";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import { scrollbarWidth } from "utils/helpers";
import { useWindowSizeHooks } from "./dragResizeHooks";
import type { AppState } from "@appsmith/reducers";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { useLocation } from "react-router";
import { CANVAS_VIEWPORT } from "constants/componentClassNameConstants";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import { useIsAppSidebarEnabled } from "../../navigation/featureFlagHooks";

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
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const currentPageId = useSelector(getCurrentPageId);
  const isCanvasInitialized = useSelector(getIsCanvasInitialized);
  const appLayout = useSelector(getCurrentApplicationLayout);
  const isAppSettingsPaneOpen = useSelector(getIsAppSettingsPaneOpen);
  const layoutSystemType = useSelector(getLayoutSystemType);
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
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const isEmbed = queryParams.get("embed");
  const isNavbarVisibleInEmbeddedApp = queryParams.get("navbar");
  const isAppSidebarEnabled = useIsAppSidebarEnabled();

  const isPreviewing = isPreviewMode;

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
      layoutSystemType === LayoutSystemTypes.AUTO ? 0 : GUTTER_WIDTH;

    // if preview mode is not on and the app setting pane is not opened, we need to subtract the width of the property pane
    if (
      isPreviewing === false &&
      !isAppSettingsPaneOpen &&
      appMode === APP_MODE.EDIT
    ) {
      calculatedWidth -= propertyPaneWidth;
    }

    // if app setting pane is open, we need to subtract the width of app setting page width
    if (
      isAppSettingsPaneOpen === true &&
      appMode === APP_MODE.EDIT &&
      !isAppSidebarEnabled
    ) {
      calculatedWidth -= APP_SETTINGS_PANE_WIDTH;
    }

    // if explorer is closed or its preview mode, we don't need to subtract the EE width
    if (
      isExplorerPinned === true &&
      !isPreviewing &&
      appMode === APP_MODE.EDIT
    ) {
      calculatedWidth -= explorerWidth;
    }

    if (appMode === APP_MODE.EDIT && isAppSidebarEnabled) {
      calculatedWidth -= APP_SIDEBAR_WIDTH;
    }

    /**
     * If there is
     * 1. a sidebar for navigation,
     * 2. it is pinned,
     * 3. device is not mobile
     * 4. and it is not an embedded app
     * we need to subtract the sidebar width as well in the following modes -
     * 1. Preview
     * 2. App settings open with navigation tab
     * 3. Published
     */
    const isEmbeddedAppWithNavVisible = isEmbed && isNavbarVisibleInEmbeddedApp;
    if (
      (appMode === APP_MODE.PUBLISHED ||
        isPreviewing ||
        isAppSettingsPaneWithNavigationTabOpen) &&
      !isMobile &&
      (!isEmbed || isEmbeddedAppWithNavVisible) &&
      sidebarWidth
    ) {
      calculatedWidth -= sidebarWidth;
    }
    if (isMobile) {
      maxWidth += sidebarWidth;
    }
    const ele: any = document.getElementById(CANVAS_VIEWPORT);
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
        const totalWidthToSubtract = gutterWidth;
        // NOTE: gutter + border width will be only substracted when theme mode and preview mode are off
        return (
          calculatedWidth -
          (appMode === APP_MODE.EDIT &&
          !isPreviewing &&
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
    if (rightColumn !== calculatedWidth || !isCanvasInitialized) {
      dispatch(updateCanvasLayoutAction(calculatedWidth));
    }
    return calculatedWidth;
  };

  const debouncedResize = useCallback(debounce(resizeToLayout, 250), [
    mainCanvasProps,
    screenWidth,
  ]);

  const immediateDebouncedResize = useCallback(debounce(resizeToLayout), [
    mainCanvasProps,
    screenWidth,
    currentPageId,
    appMode,
    appLayout,
    isPreviewing,
  ]);

  const resizeObserver = new ResizeObserver(immediateDebouncedResize);
  useEffect(() => {
    const ele: any = document.getElementById(CANVAS_VIEWPORT);
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
  }, [appLayout, currentPageId, isPreviewing]);

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
  }, [screenWidth]);

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
    isPreviewing,
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
        layoutSystemType === LayoutSystemTypes.AUTO
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
      const canvasWidth: number = resizeToLayout();
      dispatch(
        updateLayoutForMobileBreakpointAction(
          MAIN_CONTAINER_WIDGET_ID,
          layoutSystemType === LayoutSystemTypes.AUTO
            ? mainCanvasProps?.isMobile
            : false,
          canvasWidth,
        ),
      );
      dispatch({
        type: ReduxActionTypes.PROCESS_AUTO_LAYOUT_DIMENSION_UPDATES,
      });
    }
  }, [isAutoCanvasResizing]);

  return isCanvasInitialized;
};
