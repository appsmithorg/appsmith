import { createReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { User } from "constants/userConstants";

export type AuthUserState = {
  username: string;
  email: string;
  id: string;
  role: string;
};

const initialState: AuthUserState = {
  username: "",
  email: "",
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
      username: action.payload.username,
      email: action.payload.email,
      id: action.payload.id,
    };
  },
});

export default authUserReducer;
