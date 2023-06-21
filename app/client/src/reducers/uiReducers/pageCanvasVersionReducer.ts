import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { WidgetType } from "constants/WidgetConstants";

export interface CanvasStructure {
  widgetName: string;
  widgetId: string;
  type: WidgetType;
  children?: CanvasStructure[];
}

export interface PageCanvasVersionReduxState {
  [pageId: string]: {
    oldVersion: number | null;
    newVersion: number | null;
  };
}

const initialState: PageCanvasVersionReduxState = {};

const pageCanvasVersionReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_PAGE_CANVAS_VERSIONS]: (
    state: PageCanvasVersionReduxState,
    action: ReduxAction<
      Array<{
        pageId: string;
        oldVersion: number | null;
        newVersion: number | null;
      }>
    >,
  ) => {
    action.payload.forEach((entry) => {
      state[entry.pageId] = {
        oldVersion: entry?.oldVersion,
        newVersion: entry?.newVersion,
      };
    });
  },
});

export default pageCanvasVersionReducer;
