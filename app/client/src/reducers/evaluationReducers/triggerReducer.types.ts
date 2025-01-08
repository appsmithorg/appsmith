import type {
  ConditionalOutput,
  FormEvalOutput,
  FormEvaluationState,
} from "./formEvaluationReducer.types";

// Type for the object that will store the eval output for the app
export type TriggerValuesEvaluationState = Record<string, FormEvalOutput>;

export interface TriggerActionPayload {
  formId: string;
  values: ConditionalOutput;
}

export interface TriggerActionLoadingPayload {
  formId: string;
  keys: string[]; // keys that need their loading states set.
  value: boolean;
}

// Re-export for backward compatibility
export type { ConditionalOutput, FormEvalOutput, FormEvaluationState };
