import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "../../constants/ReduxActionConstants";
import _ from "lodash";
import { ActionCreateUpdateResponse } from "../../api/ActionAPI";
import { PageAction } from "../../constants/ActionConstants";

const initialState: ActionDataState = {};

export interface ActionDataState {
  [name: string]: ActionCreateUpdateResponse;
}

const actionsReducer = createReducer(initialState, {
  [ReduxActionTypes.LOAD_CANVAS_ACTIONS]: (
    state: ActionDataState,
    action: ReduxAction<PageAction[]>,
  ) => {
    const actionMap = _.mapKeys(action.payload, (action: PageAction) => {
      return action.actionId;
    });
    return { ...state, ...actionMap };
  },
});

export default actionsReducer;
