import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { createReducer } from "utils/AppsmithUtils";

type User = {
  name: string;
  email: string;
};

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
});

export type AppCollabReducerState = {
  editors: User[];
};

export default appCollabReducer;
