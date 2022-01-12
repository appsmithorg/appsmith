import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { FetchPageRequest } from "api/PageApi";

export type ConditonalObject = Record<string, string>;

export type ConditionalOutput = {
  visible?: boolean;
  enabled?: boolean;
  conditionals?: ConditonalObject;
};

export type FormEvalOutput = Record<string, ConditionalOutput>;

export type FormEvaluationState = Record<string, FormEvalOutput>;

const initialState: FormEvaluationState = {};

const formEvaluation = createReducer(initialState, {
  [ReduxActionTypes.SET_FORM_EVALUATION]: (
    state: FormEvaluationState,
    action: ReduxAction<FormEvaluationState>,
  ): FormEvaluationState => action.payload,
  [ReduxActionTypes.FETCH_PAGE_INIT]: (
    state: FormEvaluationState,
    action: ReduxAction<FetchPageRequest>,
  ) => {
    // Init the state on first page load
    if (!!action.payload && action.payload.isFirstLoad) return initialState;
    // Do not touch state on subsequent page loads
    return state;
  },
});

export default formEvaluation;
