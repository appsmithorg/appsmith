import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { FetchPageRequest } from "api/PageApi";

export type DynamicValues = {
  allowedToFetch: boolean;
  isLoading: boolean;
  hasStarted: boolean;
  data: any;
  config: any;
};

export type dynamicValueFetchConfig = {
  isLoading: boolean;
  data: any;
};

export type conditionalConfig = string | dynamicValueFetchConfig;

export type ConditonalObject = Record<string, any>;

export type ConditionalOutput = {
  visible?: boolean;
  enabled?: boolean;
  fetchDynamicValues?: DynamicValues;
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
