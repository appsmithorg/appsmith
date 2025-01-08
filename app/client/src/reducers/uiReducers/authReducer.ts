import { createReducer } from "utils/ReducerUtils";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";

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
  [ReduxActionErrorTypes.VERIFY_INVITE_ERROR]: () => ({
    isValidatingToken: false,
    isTokenValid: false,
  }),
});

import type { AuthState } from "./authReducer.types";

export default authReducer;
