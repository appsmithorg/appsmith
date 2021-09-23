import { updateCanvasLayout } from "actions/editorActions";
import { theme } from "constants/DefaultTheme";
import {
  DefaultLayoutType,
  layoutConfigurations,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { APP_MODE } from "entities/App";
import { debounce } from "lodash";
import { AppsmithDefaultLayout } from "pages/Editor/MainContainerLayoutControl";
import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { getWidget, getWidgets } from "sagas/selectors";
import { getAppMode } from "selectors/applicationSelectors";
import {
  getCurrentApplicationLayout,
  getCurrentPageId,
  previewModeSelector,
} from "selectors/editorSelectors";
import { calculateDynamicHeight } from "utils/DSLMigrations";
import { useWindowSizeHooks } from "./dragResizeHooks";

export const useDynamicAppLayout = () => {
  const dispatch = useDispatch();
  const domEntityExplorer = document.querySelector(".js-entity-explorer");
  const domPropertyPane = document.querySelector(".js-property-pane-sidebar");
  const { height: screenHeight, width: screenWidth } = useWindowSizeHooks();
  const mainContainer = useSelector((state: AppState) =>
    getWidget(state, MAIN_CONTAINER_WIDGET_ID),
  );
  const isPreviewMode = useSelector(previewModeSelector);
  const currentPageId = useSelector(getCurrentPageId);
  const appMode = useSelector(getAppMode);
  const canvasWidgets = useSelector(getWidgets);
  const appLayout = useSelector(getCurrentApplicationLayout);

  /**
   * calculate the width for the canvas
   *
   * @param screenWidth
   * @param layoutMaxWidth
   * @returns
   */
  const calculateFluidMaxWidth = (
    screenWidth: number,
    layoutMaxWidth: number,
  ) => {
    const screenWidthWithBuffer = screenWidth;
    const widthToFill =
      appMode === APP_MODE.EDIT
        ? screenWidthWithBuffer -
          (domEntityExplorer?.clientWidth || 0) -
          (domPropertyPane?.clientWidth || 0)
        : screenWidth;
    if (layoutMaxWidth < 0) {
      return widthToFill;
    } else {
      return widthToFill < layoutMaxWidth ? widthToFill : layoutMaxWidth;
    }
  };

  const resizeToLayout = (
    screenWidth: number,
    appLayout = AppsmithDefaultLayout,
  ) => {
    const { type } = appLayout;
    const { minWidth = -1, maxWidth = -1 } =
      layoutConfigurations[type] || layoutConfigurations[DefaultLayoutType];

    const calculatedMinWidth =
      appMode === APP_MODE.EDIT
        ? minWidth - parseInt(theme.sidebarWidth)
        : minWidth;
    const layoutWidth = calculateFluidMaxWidth(screenWidth, maxWidth);
    const { rightColumn } = mainContainer;
    if (
      (type === "FLUID" || calculatedMinWidth <= layoutWidth) &&
      rightColumn !== layoutWidth
    ) {
      dispatch(updateCanvasLayout(layoutWidth, mainContainer.minHeight));
    }
  };

  const debouncedResize = useCallback(debounce(resizeToLayout, 250), [
    mainContainer,
  ]);

  /**
   * calculates min height
   */
  const calculatedMinHeight = useMemo(() => {
    return calculateDynamicHeight(canvasWidgets, mainContainer.minHeight);
  }, [mainContainer]);

  useEffect(() => {
    if (calculatedMinHeight !== mainContainer.minHeight) {
      dispatch(
        updateCanvasLayout(mainContainer.rightColumn, calculatedMinHeight),
      );
    }
  }, [screenHeight, mainContainer.minHeight]);

  useEffect(() => {
    debouncedResize(screenWidth, appLayout);
  }, [screenWidth]);

  useEffect(() => {
    resizeToLayout(screenWidth, appLayout);
  }, [appLayout, currentPageId, mainContainer.rightColumn]);
};
