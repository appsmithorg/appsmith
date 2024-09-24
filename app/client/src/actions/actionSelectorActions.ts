import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export const evaluateActionSelectorField = (payload: {
  id: string;
  type: string;
  value: string;
}) => ({
  type: ReduxActionTypes.EVALUATE_ACTION_SELECTOR_FIELD,
  payload,
});

export const setEvaluatedActionSelectorField = (payload: {
  id: string;
  evaluatedValue: {
    value: string;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errors: any[];
  };
}) => ({
  type: ReduxActionTypes.SET_EVALUATED_ACTION_SELECTOR_FIELD,
  payload,
});

export const clearEvaluatedActionSelectorField = (id: string) => ({
  type: ReduxActionTypes.CLEAR_EVALUATED_ACTION_SELECTOR_FIELD,
  payload: id,
});
