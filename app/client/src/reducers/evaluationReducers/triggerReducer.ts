import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type {
  ConditionalOutput,
  DynamicValues,
  FormEvalOutput,
  FormEvaluationState,
} from "./formEvaluationReducer";
import produce from "immer";

// // Type for the object that will store the eval output for the app
export type TriggerValuesEvaluationState = Record<string, FormEvalOutput>;

export interface TriggerActionPayload {
  formId: string;
  values: ConditionalOutput;
}

export interface TriggerActionNextPagePayload {
  actionId: string;
  value: DynamicValues;
  identifier: string;
}

export interface TriggerActionLoadingPayload {
  formId: string;
  keys: string[]; // keys that need their loading states set.
  value: boolean;
}

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
  [ReduxActionTypes.FETCH_FORM_DYNAMIC_VAL_NEXT_PAGE_INIT]: (
    state: FormEvaluationState,
    action: ReduxAction<{ identifier: string; actionId: string }>,
  ) =>
    produce(state, (draftState) => {
      const { actionId, identifier } = action.payload;

      if (!draftState[actionId][identifier].fetchDynamicValues) {
        return draftState;
      }

      draftState[actionId][identifier].fetchDynamicValues.isLoading = true;
    }),
  [ReduxActionTypes.FETCH_FORM_DYNAMIC_VAL_NEXT_PAGE_SUCCESS]: (
    state: FormEvaluationState,
    action: ReduxAction<TriggerActionNextPagePayload>,
  ) =>
    produce(state, (draftState) => {
      const { actionId, identifier, value: newValue } = action.payload;

      if (!draftState[actionId][identifier].fetchDynamicValues?.data) {
        return draftState;
      }

      const triggers = state[actionId];
      const storedConditionalOutput = triggers[identifier];

      let content: Array<unknown> = [];

      if (storedConditionalOutput.fetchDynamicValues?.data.content) {
        content = [
          ...storedConditionalOutput.fetchDynamicValues?.data.content,
          ...newValue.data.content,
        ];
      }

      const updatedData = {
        content,
        startIndex: newValue.data.startIndex || 0,
        count: newValue.data.count || 0,
        total: newValue.data.total || 0,
      };

      draftState[actionId][identifier].fetchDynamicValues.data = updatedData;
      draftState[actionId][identifier].fetchDynamicValues.isLoading = false;

      return draftState;
    }),
  [ReduxActionTypes.SET_TRIGGER_VALUES_LOADING]: (
    state: FormEvaluationState,
    action: ReduxAction<TriggerActionLoadingPayload>,
  ) => {
    const triggers = state[action.payload.formId];

    const triggersToBeFetched: FormEvalOutput = {};

    Object.entries(triggers).forEach(([key, value]) => {
      if (action.payload.keys.includes(key)) {
        const newValue = {
          ...value,
          fetchDynamicValues: {
            ...value.fetchDynamicValues,
            isLoading: action.payload.value,
          },
        };

        triggersToBeFetched[key] = newValue as unknown as FormEvalOutput;
      }
    });

    return {
      [action.payload.formId]: {
        ...triggers,
        ...triggersToBeFetched,
      },
    };
  },
});

export default triggers;
