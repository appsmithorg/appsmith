import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";

const initialState: AuthState = {
  isValidatingToken: true,
  isTokenValid: false,
};

const authReducer = createReducer(initialState, {
  [ReduxActionTypes.RESET_PASSWORD_VERIFY_TOKEN_INIT]: () => ({
    isTokenValid: false,
    isValidatingToken: true,
  }),
  [ReduxActionTypes.RESET_PASSWORD_VERIFY_TOKEN_SUCCESS]: () => ({
    isValidatingToken: false,
    isTokenValid: true,
  }),
  [ReduxActionErrorTypes.RESET_PASSWORD_VERIFY_TOKEN_ERROR]: () => ({
    isValidatingToken: false,
    isTokenValid: false,
  }),
  [ReduxActionTypes.VERIFY_INVITE_INIT]: () => ({
    isTokenValid: false,
    isValidatingToken: true,
  }),
  [ReduxActionTypes.VERIFY_INVITE_SUCCESS]: () => ({
    isValidatingToken: false,
    isTokenValid: true,
  }),
  [ReduxActionErrorTypes.VERIFY_INVITE_ERROR]: () => ({
    isValidatingToken: false,
    isTokenValid: false,
  }),
});

export interface AuthState {
  isValidatingToken: boolean;
  isTokenValid: boolean;
}

export default authReducer;
