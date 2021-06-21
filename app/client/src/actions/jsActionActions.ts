import {
  ReduxActionTypes,
  EvaluationReduxAction,
} from "constants/ReduxActionConstants";
import { JSAction } from "entities/JSAction";

export type FetchActionsPayload = {
  applicationId: string;
};

export const fetchJSActions = (
  applicationId: string,
): EvaluationReduxAction<unknown> => {
  return {
    type: ReduxActionTypes.FETCH_JS_ACTIONS_INIT,
    payload: { applicationId },
  };
};

export const createJSActionRequest = (payload: Partial<JSAction>) => {
  return {
    type: ReduxActionTypes.CREATE_JS_ACTION_INIT,
    payload,
  };
};

export const createJSActionSuccess = (payload: JSAction) => {
  return {
    type: ReduxActionTypes.CREATE_JS_ACTION_SUCCESS,
    payload,
  };
};

export default {
  fetchJSActions,
};
