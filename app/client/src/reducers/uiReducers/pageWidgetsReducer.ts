import { createImmerReducer } from "utils/ReducerUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { DSL } from "reducers/uiReducers/pageCanvasStructureReducer";
import { WidgetProps } from "widgets/BaseWidget";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";

export interface PageWidgetsReduxState {
  [pageId: string]: {
    [widgetId: string]: WidgetProps & { children: string[] };
  };
}

const initialState: PageWidgetsReduxState = {};

const pageWidgetsReducer = createImmerReducer(initialState, {
  // Reducer to clear all pageWidgets before finishing creating
  // a new application
  [ReduxActionTypes.RESET_APPLICATION_WIDGET_STATE_REQUEST]: () => ({}),
  [ReduxActionTypes.FETCH_PAGE_DSLS_SUCCESS]: (
    state: PageWidgetsReduxState,
    action: ReduxAction<Array<{ pageId: string; dsl: DSL }>>,
  ) => {
    action.payload.forEach((entry) => {
      state[entry.pageId] = CanvasWidgetsNormalizer.normalize(
        entry.dsl,
      ).entities.canvasWidgets;
    });
  },
  [ReduxActionTypes.FETCH_PAGE_DSL_SUCCESS]: (
    state: PageWidgetsReduxState,
    action: ReduxAction<{ pageId: string; dsl?: DSL }>,
  ) => {
    if (!action.payload.dsl) {
      delete state[action.payload.pageId];
    } else {
      state[action.payload.pageId] = CanvasWidgetsNormalizer.normalize(
        action.payload.dsl,
      ).entities.canvasWidgets;
    }
  },
});

export default pageWidgetsReducer;
