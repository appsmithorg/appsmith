import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { Action, RestAction } from "entities/Action";
import _ from "lodash";
import { ApiPaneReduxState } from "reducers/uiReducers/apiPaneReducer";

export type ActionDraftsState = Record<string, Action>;

const initialState: ActionDraftsState = {};

const actionDraftsReducer = createReducer(initialState, {
  [ReduxActionTypes.UPDATE_API_DRAFT]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string; draft: Partial<RestAction> }>,
  ) => ({
    ...state,
    [action.payload.id]: action.payload.draft,
  }),
  [ReduxActionTypes.DELETE_API_DRAFT]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => _.omit(state, action.payload.id),
});

export default actionDraftsReducer;
