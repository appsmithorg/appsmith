import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

export enum AppLoadErrorTypes {
  SERVER_NOT_RESPONDING = "SERVER_NOT_RESPONDING",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
}

export type AppErrorReduxState = {
  errorType?: AppLoadErrorTypes;
  resourceType?: string;
  resourceId?: string;
};

const initialState: AppErrorReduxState = {};

const appLoadErrorReducer = createReducer(initialState, {
  [ReduxActionTypes.HANDLE_SERVER_NOT_RESPONDING]: (): AppErrorReduxState => {
    return { errorType: AppLoadErrorTypes.SERVER_NOT_RESPONDING };
  },
  [ReduxActionTypes.HANDLE_RESOURCE_NOT_FOUND_ERROR]: (
    state: AppErrorReduxState,
    action: ReduxAction<{ resourceType: string; resourceId: string }>,
  ): AppErrorReduxState => {
    return {
      errorType: AppLoadErrorTypes.RESOURCE_NOT_FOUND,
      ...action.payload,
    };
  },
});

export default appLoadErrorReducer;
