import { createReducer } from "utils/ReducerUtils";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { FetchPageRequest } from "api/PageApi";
import { FormConfigType } from "components/formControls/BaseControl";

// Type for the object that will store the dynamic values for each component
export type DynamicValues = {
  allowedToFetch: boolean;
  isLoading: boolean;
  hasStarted: boolean;
  hasFetchFailed: boolean;
  data: any;
  config: DynamicValuesConfig;
  evaluatedConfig: DynamicValuesConfig;
  dynamicDependencyPathList?: Set<string> | undefined;
};

export type DynamicValuesConfig = { url?: string; params: Record<string, any> };

export type EvaluatedFormConfig = {
  updateEvaluatedConfig: boolean;
  paths: string[];
  evaluateFormConfigObject: FormConfigEvalObject;
};

export type ConditonalObject = Record<string, any>;

// Type for the object that will store the evaluation output for each component
export type ConditionalOutput = {
  visible?: boolean;
  enabled?: boolean;
  fetchDynamicValues?: DynamicValues;
  conditionals?: ConditonalObject;
  evaluateFormConfig?: EvaluatedFormConfig;
  configPropertyPath?: string;
  staticDependencyPathList?: Set<string> | undefined;
};

export type FormConfigEvalObject = {
  [path: string]: { expression: string; output: string };
};

// Type for the object that will store the eval output for the form
export type FormEvalOutput = Record<string, ConditionalOutput>;

// Type for the object that will store the eval output for the app
export type FormEvaluationState = Record<string, FormEvalOutput>;

export const isValidFormConfig = (
  config: FormConfigType,
): config is FormConfigType => {
  return "controlType" in config;
};

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
