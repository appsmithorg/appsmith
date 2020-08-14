import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "constants/ReduxActionConstants";
import { ContainerWidgetProps } from "@appsmith/widgets/ContainerWidget";
import { WidgetProps } from "@appsmith/widgets/BaseWidget";

export type PageDSLsReduxState = {
  [pageId: string]: ContainerWidgetProps<WidgetProps>;
};

const initialState: PageDSLsReduxState = {};

const pageDSLsReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_PAGE_DSL_SUCCESS]: (
    state: PageDSLsReduxState,
    action: ReduxAction<{
      pageId: string;
      dsl: ContainerWidgetProps<WidgetProps>;
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
