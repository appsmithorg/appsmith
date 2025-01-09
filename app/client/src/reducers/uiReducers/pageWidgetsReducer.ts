import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "../../actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

import type { FlattenedDSL } from "@shared/dsl";
import { flattenDSL } from "@shared/dsl";
import type { WidgetProps } from "widgets/BaseWidget";

export interface PageWidgetsReduxState {
  [pageId: string]: {
    dsl: FlattenedDSL<WidgetProps>;
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
    action: ReduxAction<
      Array<{ pageId: string; dsl: WidgetProps; layoutId: string }>
    >,
  ) => {
    action.payload.forEach((entry) => {
      const dsl = flattenDSL(entry.dsl);

      state[entry.pageId] = { dsl, layoutId: entry.layoutId };
    });
  },
  [ReduxActionTypes.FETCH_PAGE_DSL_SUCCESS]: (
    state: PageWidgetsReduxState,
    action: ReduxAction<{
      pageId: string;
      dsl?: WidgetProps;
      layoutId: string;
    }>,
  ) => {
    if (!action.payload.dsl) {
      delete state[action.payload.pageId];
    } else {
      const dsl = flattenDSL(action.payload.dsl);

      state[action.payload.pageId] = { dsl, layoutId: action.payload.layoutId };
    }
  },
});

export default pageWidgetsReducer;
