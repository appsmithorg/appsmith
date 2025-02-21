import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type {
  ConditionalOutput,
  DynamicValues,
  FormEvalOutput,
  FormEvaluationState,
} from "./formEvaluationReducer";
import { create } from "mutative";

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
  [ReduxActionTypes.FETCH_FORM_DYNAMIC_VAL_NEXT_PAGE_SUCCESS]: (
    state: FormEvaluationState,
    action: ReduxAction<TriggerActionNextPagePayload>,
  ) =>
    create(state, (draftState) => {
      const { actionId, identifier, value: newValue } = action.payload;

      if (!draftState[actionId][identifier].fetchDynamicValues?.data) {
        return draftState;
      }

      const triggers = state[actionId];
      const storedConditionalOutput = triggers[identifier];

      let content: Array<unknown> =
        storedConditionalOutput.fetchDynamicValues?.data.content;

      // if stored data is already of the same length or more than the incoming data
      // then this might be a duplicate call and needs to be skipped.
      if (newValue.data.count + newValue.data.startIndex <= content.length) {
        return draftState;
      }

      content = [
        ...storedConditionalOutput.fetchDynamicValues?.data.content,
        ...newValue.data.content,
      ];

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
