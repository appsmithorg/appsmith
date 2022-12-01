import { createImmerReducer } from "utils/ReducerUtils";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { compareAndGenerateImmutableCanvasStructure } from "utils/canvasStructureHelpers";
import { WidgetType } from "constants/WidgetConstants";

export interface CanvasStructure {
  widgetName: string;
  widgetId: string;
  type: WidgetType;
  children?: CanvasStructure[];
}

export interface DSL extends WidgetProps {
  children?: DSL[];
}
export interface PageCanvasStructureReduxState {
  [pageId: string]: CanvasStructure;
}

const initialState: PageCanvasStructureReduxState = {};

const pageCanvasStructureReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.FETCH_PAGE_DSLS_SUCCESS]: (
    state: PageCanvasStructureReduxState,
    action: ReduxAction<
      Array<{
        pageId: string;
        dsl: DSL;
      }>
    >,
  ) => {
    action.payload.forEach((entry) => {
      state[entry.pageId] = compareAndGenerateImmutableCanvasStructure(
        state[entry.pageId],
        entry.dsl,
      );
    });
  },
  [ReduxActionTypes.FETCH_PAGE_DSL_SUCCESS]: (
    state: PageCanvasStructureReduxState,
    action: ReduxAction<{ pageId: string; dsl?: DSL }>,
  ) => {
    if (!action.payload.dsl) {
      delete state[action.payload.pageId];
    } else {
      state[action.payload.pageId] = compareAndGenerateImmutableCanvasStructure(
        state[action.payload.pageId],
        action.payload.dsl,
      );
    }
  },
  [ReduxActionErrorTypes.FETCH_PAGE_DSL_ERROR]: (
    state: PageCanvasStructureReduxState,
    action: ReduxAction<{ pageId: string }>,
  ) => {
    return { ...state, [action.payload.pageId]: false };
  },
  [ReduxActionTypes.RESET_APPLICATION_WIDGET_STATE_REQUEST]: (
    state: PageCanvasStructureReduxState,
  ) => {
    Object.keys(state).forEach((key) => delete state[key]);
  },
});

export default pageCanvasStructureReducer;
