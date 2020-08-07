import { createReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { User } from "constants/userConstants";

export type AuthUserState = {
  name: string;
  id: string;
  role: string;
};

const initialState: AuthUserState = {
  name: "",
  id: "",
  role: "",
};

const authUserReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS]: (
    state: AuthUserState,
    action: ReduxAction<User>,
  ) => {
    return {
      ...state,
      name: action.payload.username,
      id: action.payload.id,
    };
  },
});

export default authUserReducer;
