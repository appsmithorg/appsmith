import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { createReducer } from "utils/AppsmithUtils";
import { User } from "entities/AppCollab/CollabInterfaces";

const initialState: AppCollabReducerState = {
  editors: [],
};

const appCollabReducer = createReducer(initialState, {
  [ReduxActionTypes.APP_COLLAB_LIST_EDITORS]: (
    state: AppCollabReducerState,
    action: ReduxAction<any>,
  ) => {
    return { ...state, editors: action.payload.users };
  },
  [ReduxActionTypes.APP_COLLAB_RESET_EDITORS]: (
    state: AppCollabReducerState,
  ) => {
    return { ...state, editors: [] };
  },
});

export type AppCollabReducerState = {
  editors: User[];
};

export default appCollabReducer;
