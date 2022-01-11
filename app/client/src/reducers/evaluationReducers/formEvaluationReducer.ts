import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { FetchPageRequest } from "api/PageApi";

// Type for the object that will store the dynamic values for each component
export type DynamicValues = {
  allowedToFetch: boolean;
  isLoading: boolean;
  hasStarted: boolean;
  hasFetchFailed: boolean;
  data: any;
  config: { url: string; method: string; params?: string[] };
};

export type ConditonalObject = Record<string, any>;

// Type for the object that will store the evaluation output for each component
export type ConditionalOutput = {
  visible?: boolean;
  enabled?: boolean;
  fetchDynamicValues?: DynamicValues;
  conditionals?: ConditonalObject;
};

// Type for the object that will store the eval output for the form
export type FormEvalOutput = Record<string, ConditionalOutput>;

// Type for the object that will store the eval output for the app
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
