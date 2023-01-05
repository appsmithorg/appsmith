import { debounce, get } from "lodash";
import { useCallback, useEffect, useMemo } from "react";
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
import { getIsAppSettingsPaneOpen } from "selectors/appSettingsPaneSelectors";
import {
  getCurrentApplicationLayout,
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
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import { scrollbarWidth } from "utils/helpers";
import { useWindowSizeHooks } from "./dragResizeHooks";

const BORDERS_WIDTH = 2;
const GUTTER_WIDTH = 72;

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
    const { maxWidth, minWidth } = layoutWidthRange;
    let calculatedWidth = screenWidth - scrollbarWidth();

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
    const ele: any = document.getElementById("canvas-viewport");
    if (
      appMode === "EDIT" &&
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
        const totalWidthToSubtract = BORDERS_WIDTH + GUTTER_WIDTH;
        // NOTE: gutter + border width will be only substracted when theme mode and preview mode are off
        return (
          calculatedWidth -
          (appMode === APP_MODE.EDIT && !isPreviewMode
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
  }, [appLayout, currentPageId]);

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
   */
  useEffect(() => {
    resizeToLayout();
  }, [
    appLayout,
    mainCanvasProps?.width,
    isPreviewMode,
    explorerWidth,
    propertyPaneWidth,
    isExplorerPinned,
    propertyPaneWidth,
    isAppSettingsPaneOpen,
  ]);

  useEffect(() => {
    function relayoutAtBreakpoint() {
      dispatch(
        updateLayoutForMobileBreakpointAction(
          MAIN_CONTAINER_WIDGET_ID,
          mainCanvasProps?.isMobile,
          calculateCanvasWidth(),
        ),
      );
    }
    relayoutAtBreakpoint();
  }, [mainCanvasProps?.isMobile]);

  return isCanvasInitialized;
};
