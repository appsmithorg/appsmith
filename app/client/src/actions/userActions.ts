import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { CurrentUserDetailsRequestPayload } from "constants/userConstants";

export const logoutUserSuccess = () => ({
  type: ReduxActionTypes.LOGOUT_USER_SUCCESS,
});

export const logoutUserError = (error: any) => ({
  type: ReduxActionErrorTypes.LOGOUT_USER_ERROR,
  payload: {
    error,
  },
});

export const fetchCurrentUser = () => ({
  type: ReduxActionTypes.FETCH_USER_INIT,
  payload: CurrentUserDetailsRequestPayload,
});

export const setCurrentUserDetails = () => ({
  type: ReduxActionTypes.SET_CURRENT_USER_INIT,
  payload: CurrentUserDetailsRequestPayload,
});
