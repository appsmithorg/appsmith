import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "constants/ReduxActionConstants";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetProps } from "widgets/NewBaseWidget";

export type PageDSLsReduxState = {
  [pageId: string]: ContainerWidgetProps;
};

const initialState: PageDSLsReduxState = {};

const pageDSLsReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_PAGE_DSL_SUCCESS]: (
    state: PageDSLsReduxState,
    action: ReduxAction<{
      pageId: string;
      dsl: ContainerWidgetProps;
    }>,
  ) => {
    return { ...state, [action.payload.pageId]: action.payload.dsl };
  },
  [ReduxActionErrorTypes.FETCH_PAGE_DSL_ERROR]: (
    state: PageDSLsReduxState,
    action: ReduxAction<{ pageId: string }>,
  ) => {
    return { ...state, [action.payload.pageId]: false };
  },
});

export default pageDSLsReducer;
