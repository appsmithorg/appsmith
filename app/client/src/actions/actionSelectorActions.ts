import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

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
