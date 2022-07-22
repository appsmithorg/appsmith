import { debounce, get } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useMemo } from "react";

import {
  DefaultLayoutType,
  layoutConfigurations,
} from "constants/WidgetConstants";
import {
  getExplorerPinned,
  getExplorerWidth,
} from "selectors/explorerSelector";
import {
  getCurrentApplicationLayout,
  getCurrentPageId,
  getMainCanvasProps,
  previewModeSelector,
} from "selectors/editorSelectors";
import { APP_MODE } from "entities/App";
import { scrollbarWidth } from "utils/helpers";
import { useWindowSizeHooks } from "./dragResizeHooks";
import { getAppMode } from "selectors/entitiesSelector";
import { updateCanvasLayoutAction } from "actions/editorActions";
import { calculateDynamicHeight } from "utils/DSLMigrations";
import { getIsCanvasInitialized } from "selectors/mainCanvasSelectors";

const BORDERS_WIDTH = 2;
const GUTTER_WIDTH = 72;

export const useDynamicAppLayout = () => {
  const dispatch = useDispatch();
  const explorerWidth = useSelector(getExplorerWidth);
  const isExplorerPinned = useSelector(getExplorerPinned);
  const appMode: APP_MODE | undefined = useSelector(getAppMode);
  const { height: screenHeight, width: screenWidth } = useWindowSizeHooks();
  const mainCanvasProps = useSelector(getMainCanvasProps);
  const isPreviewMode = useSelector(previewModeSelector);
  const currentPageId = useSelector(getCurrentPageId);
  const isCanvasInitialized = useSelector(getIsCanvasInitialized);
  const appLayout = useSelector(getCurrentApplicationLayout);

  /**
   * calculates min height
   */
  const calculatedMinHeight = useMemo(() => {
    return calculateDynamicHeight();
  }, [mainCanvasProps]);

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
   * @param screenWidth
   * @param layoutMaxWidth
   * @returns
   */
  const calculateCanvasWidth = () => {
    const domEntityExplorer = document.querySelector(".js-entity-explorer");
    const domPropertyPane = document.querySelector(".js-property-pane-sidebar");
    const { maxWidth, minWidth } = layoutWidthRange;
    let calculatedWidth = screenWidth - scrollbarWidth();

    // if preview mode is on, we don't need to subtract the Property Pane width
    if (isPreviewMode === false) {
      const propertyPaneWidth = domPropertyPane?.clientWidth || 0;

      calculatedWidth -= propertyPaneWidth;
    }

    // if explorer is closed or its preview mode, we don't need to subtract the EE width
    if (isExplorerPinned === true && !isPreviewMode) {
      const explorerWidth = domEntityExplorer?.clientWidth || 0;

      calculatedWidth -= explorerWidth;
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
      dispatch(updateCanvasLayoutAction(calculatedWidth, calculatedMinHeight));
    }
  };

  const debouncedResize = useCallback(debounce(resizeToLayout, 250), [
    mainCanvasProps,
    screenWidth,
  ]);

  /**
   * when screen height is changed, update canvas layout
   */
  useEffect(() => {
    if (calculatedMinHeight !== mainCanvasProps?.height) {
      dispatch(
        updateCanvasLayoutAction(mainCanvasProps?.width, calculatedMinHeight),
      );
    }
  }, [screenHeight, mainCanvasProps?.height]);

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
    currentPageId,
    mainCanvasProps?.width,
    isPreviewMode,
    explorerWidth,
    isExplorerPinned,
  ]);

  return isCanvasInitialized;
};
