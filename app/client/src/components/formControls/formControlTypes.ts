// Type for the object that will store the dynamic values for each component
export interface DynamicValues {
  allowedToFetch: boolean;
  isLoading: boolean;
  hasStarted: boolean;
  hasFetchFailed: boolean;
  data: any;
  config: DynamicValuesConfig;
  evaluatedConfig: DynamicValuesConfig;
  dynamicDependencyPathList?: Set<string> | undefined;
}

export interface DynamicValuesConfig {
  url?: string;
  params: Record<string, any>;
}

export interface EvaluatedFormConfig {
  updateEvaluatedConfig: boolean;
  paths: string[];
  evaluateFormConfigObject: FormConfigEvalObject;
}

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
