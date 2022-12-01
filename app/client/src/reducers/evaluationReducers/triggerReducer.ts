import { createReducer } from "utils/ReducerUtils";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  ConditionalOutput,
  FormEvalOutput,
  FormEvaluationState,
} from "./formEvaluationReducer";

// // Type for the object that will store the eval output for the app
export type TriggerValuesEvaluationState = Record<string, FormEvalOutput>;

export type TriggerActionPayload = {
  formId: string;
  values: ConditionalOutput;
};

const initialState: TriggerValuesEvaluationState = {};

const triggers = createReducer(initialState, {
  [ReduxActionTypes.INIT_TRIGGER_VALUES]: (
    state: FormEvaluationState,
    action: ReduxAction<FormEvaluationState>,
  ): FormEvaluationState => action.payload,
  [ReduxActionTypes.FETCH_TRIGGER_VALUES_INIT]: (
    state: FormEvaluationState,
    action: ReduxAction<TriggerActionPayload>,
  ) => {
    const triggers = state[action.payload.formId];
    return {
      [action.payload.formId]: {
        ...triggers,
        ...action.payload.values,
      },
    };
  },
  [ReduxActionTypes.FETCH_TRIGGER_VALUES_SUCCESS]: (
    state: FormEvaluationState,
    action: ReduxAction<TriggerActionPayload>,
  ) => {
    const triggers = state[action.payload.formId];
    return {
      [action.payload.formId]: {
        ...triggers,
        ...action.payload.values,
      },
    };
  },
});

export default triggers;
