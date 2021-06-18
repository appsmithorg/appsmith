import {
  ReduxActionTypes,
  EvaluationReduxAction,
} from "constants/ReduxActionConstants";

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

export default {
  fetchJSActions,
};
