import { batchUpdateWidgetProperty } from "actions/controlActions";
import { theme } from "constants/DefaultTheme";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  DefaultLayoutType,
  layoutConfigurations,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { debounce } from "lodash";
import { AppsmithDefaultLayout } from "pages/Editor/MainContainerLayoutControl";
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { getWidget, getWidgets } from "sagas/selectors";
import { getAppMode } from "selectors/applicationSelectors";
import {
  getCurrentApplicationLayout,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { calculateDynamicHeight } from "utils/WidgetPropsUtils";
import { useWindowSizeHooks } from "./dragResizeHooks";

export const useDynamicAppLayout = () => {
  const { width: screenWidth, height: screenHeight } = useWindowSizeHooks();
  const mainContainer = useSelector((state: AppState) => getWidget(state, "0"));
  const currentPageId = useSelector(getCurrentPageId);
  const appMode = useSelector(getAppMode);
  const canvasWidgets = useSelector(getWidgets);
  const appLayout = useSelector(getCurrentApplicationLayout);
  const dispatch = useDispatch();

  const calculateFluidMaxWidth = (
    screenWidth: number,
    layoutMaxWidth: number,
  ) => {
    const screenWidthWithBuffer = 0.95 * screenWidth;
    const widthToFill =
      appMode === "EDIT"
        ? screenWidthWithBuffer - parseInt(theme.sidebarWidth)
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
      appMode === "EDIT" ? minWidth - parseInt(theme.sidebarWidth) : minWidth;
    const layoutWidth = calculateFluidMaxWidth(screenWidth, maxWidth);
    const { rightColumn } = mainContainer;
    if (
      (type === "FLUID" || calculatedMinWidth <= layoutWidth) &&
      rightColumn !== layoutWidth
    ) {
      dispatch({
        type: ReduxActionTypes.UPDATE_CANVAS_LAYOUT,
        payload: {
          width: layoutWidth,
        },
      });
    }
  };

  const debouncedResize = useCallback(debounce(resizeToLayout, 250), [
    mainContainer,
  ]);

  useEffect(() => {
    if (appMode === "EDIT") {
      const calculatedMinHeight = calculateDynamicHeight(
        canvasWidgets,
        mainContainer.minHeight,
      );
      if (calculatedMinHeight !== mainContainer.minHeight) {
        dispatch(
          batchUpdateWidgetProperty(MAIN_CONTAINER_WIDGET_ID, {
            modify: {
              minHeight: calculatedMinHeight,
            },
          }),
        );
      }
    }
  }, [screenHeight, mainContainer.minHeight]);

  useEffect(() => {
    debouncedResize(screenWidth, appLayout);
  }, [screenWidth]);

  useEffect(() => {
    resizeToLayout(screenWidth, appLayout);
  }, [appLayout, currentPageId]);
};
