import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { DSL } from "reducers/uiReducers/pageCanvasStructureReducer";
import type { WidgetProps } from "widgets/BaseWidget";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";

export interface PageWidgetsReduxState {
  [pageId: string]: {
    dsl: { [widgetId: string]: WidgetProps & { children: string[] } };
    layoutId: string;
  };
}

const initialState: PageWidgetsReduxState = {};

const pageWidgetsReducer = createImmerReducer(initialState, {
  // Reducer to clear all pageWidgets before finishing creating
  // a new application
  [ReduxActionTypes.RESET_APPLICATION_WIDGET_STATE_REQUEST]: () => ({}),
  [ReduxActionTypes.FETCH_PAGE_DSLS_SUCCESS]: (
    state: PageWidgetsReduxState,
    action: ReduxAction<Array<{ pageId: string; dsl: DSL; layoutId: string }>>,
  ) => {
    action.payload.forEach((entry) => {
      state[entry.pageId] = {
        dsl: CanvasWidgetsNormalizer.normalize(entry.dsl).entities
          .canvasWidgets,
        layoutId: entry.layoutId,
      };
    });
  },
  [ReduxActionTypes.FETCH_PAGE_DSL_SUCCESS]: (
    state: PageWidgetsReduxState,
    action: ReduxAction<{ pageId: string; dsl?: DSL; layoutId: string }>,
  ) => {
    if (!action.payload.dsl) {
      delete state[action.payload.pageId];
    } else {
      state[action.payload.pageId] = {
        dsl: CanvasWidgetsNormalizer.normalize(action.payload.dsl).entities
          .canvasWidgets,
        layoutId: action.payload.layoutId,
      };
    }
  },
});

export default pageWidgetsReducer;
