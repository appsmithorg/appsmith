import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { FormConfigType } from "components/formControls/BaseControl";
import type { FetchPageActionPayload } from "actions/pageActions";

// Type for the object that will store the dynamic values for each component
export interface DynamicValues {
  allowedToFetch: boolean;
  isLoading: boolean;
  hasStarted: boolean;
  hasFetchFailed: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  config: DynamicValuesConfig;
  evaluatedConfig: DynamicValuesConfig;
  dynamicDependencyPathList?: Set<string> | undefined;
}

export interface DynamicValuesConfig {
  url?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Record<string, any>;
}

export interface EvaluatedFormConfig {
  updateEvaluatedConfig: boolean;
  paths: string[];
  evaluateFormConfigObject: FormConfigEvalObject;
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConditonalObject = Record<string, any>;

// Type for the object that will store the evaluation output for each component
export interface ConditionalOutput {
  visible?: boolean;
  enabled?: boolean;
  fetchDynamicValues?: DynamicValues;
  conditionals?: ConditonalObject;
  evaluateFormConfig?: EvaluatedFormConfig;
  configPropertyPath?: string;
  staticDependencyPathList?: Set<string> | undefined;
}

export interface FormConfigEvalObject {
  [path: string]: { expression: string; output: string };
}

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
    action: ReduxAction<FetchPageActionPayload>,
  ) => {
    // Init the state on first page load
    if (!!action.payload && action.payload.isFirstLoad) return initialState;

    // Do not touch state on subsequent page loads
    return state;
  },
});

export default formEvaluation;
