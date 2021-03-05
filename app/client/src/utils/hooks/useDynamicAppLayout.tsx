import { theme } from "constants/DefaultTheme";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { debounce } from "lodash";
import { AppsmithDefaultLayout } from "pages/Editor/MainContainerLayoutControl";
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { getWidget } from "sagas/selectors";
import { getAppMode } from "selectors/applicationSelectors";
import {
  getCurrentApplicationLayout,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { useWindowSizeHooks } from "./dragResizeHooks";

// export const CANVAS_DEFAULT_WIDTH_PX = 1224;
// export const CANVAS_TABLET_WIDTH_PX = 1024;
// export const CANVAS_MOBILE_WIDTH_PX = 720;
// export const CANVAS_DEFAULT_HEIGHT_PX = 1292;
// Desktop: Old - 1224, New 1160 - 1280
// Tablet L: Old - NA, New 960 - 1080
// Tablet: Old - 1024, New 650 - 800
// Mobile: Old - 720, New 350 - 450
const widthConfig: any = {
  960: {
    minWidth: 960,
    maxWidth: 1080,
  },
  720: {
    minWidth: 350,
    maxWidth: 450,
  },
  1224: { minWidth: 1160, maxWidth: 1280 },
  1024: { minWidth: 650, maxWidth: 800 },
};
export const useDynamicAppLayout = () => {
  const { width: screenWidth } = useWindowSizeHooks();
  const mainContainer = useSelector((state: AppState) => getWidget(state, "0"));
  const currentPageId = useSelector(getCurrentPageId);
  const appMode = useSelector(getAppMode);
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
    const { type, width: layoutMaxWidth } = appLayout;
    const { minWidth = -1, maxWidth = -1 } =
      layoutMaxWidth > 0
        ? widthConfig[layoutMaxWidth] || widthConfig[1224]
        : {};
    const calculatedMinWidth =
      appMode === "EDIT" ? minWidth - parseInt(theme.sidebarWidth) : minWidth;
    const layoutWidth =
      type === "FLUID"
        ? calculateFluidMaxWidth(screenWidth, maxWidth)
        : maxWidth;
    const { rightColumn } = mainContainer;
    if (calculatedMinWidth && rightColumn !== layoutWidth) {
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
    debouncedResize(screenWidth, appLayout);
  }, [screenWidth]);

  useEffect(() => {
    resizeToLayout(screenWidth, appLayout);
  }, [appLayout, currentPageId]);
};
