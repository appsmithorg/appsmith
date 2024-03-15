import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { compareAndGenerateImmutableCanvasStructure } from "utils/canvasStructureHelpers";
import type { CanvasStructure, DSL } from "utils/canvasStructureTypes";

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
