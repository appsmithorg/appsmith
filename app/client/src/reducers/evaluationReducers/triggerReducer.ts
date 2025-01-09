import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type {
  TriggerValuesEvaluationState,
  TriggerActionPayload,
  TriggerActionLoadingPayload,
  FormEvaluationState,
  FormEvalOutput,
} from "./triggerReducer.types";

const initialState: TriggerValuesEvaluationState = {};

const triggers = createReducer(initialState, {
  [ReduxActionTypes.INIT_TRIGGER_VALUES]: (
    state: TriggerValuesEvaluationState,
    action: ReduxAction<TriggerValuesEvaluationState>,
  ): TriggerValuesEvaluationState => action.payload,
  [ReduxActionTypes.FETCH_TRIGGER_VALUES_INIT]: (
    state: TriggerValuesEvaluationState,
    action: ReduxAction<TriggerActionPayload>,
  ) => {
    const triggers = state[action.payload.formId] || {};

    return {
      [action.payload.formId]: {
        ...triggers,
        ...action.payload.values,
      },
    };
  },
  [ReduxActionTypes.FETCH_TRIGGER_VALUES_SUCCESS]: (
    state: TriggerValuesEvaluationState,
    action: ReduxAction<TriggerActionPayload>,
  ) => {
    const triggers = state[action.payload.formId] || {};

    return {
      [action.payload.formId]: {
        ...triggers,
        ...action.payload.values,
      },
    };
  },
  [ReduxActionTypes.SET_TRIGGER_VALUES_LOADING]: (
    state: TriggerValuesEvaluationState,
    action: ReduxAction<TriggerActionLoadingPayload>,
  ) => {
    const triggers = state[action.payload.formId] || {};

    const triggersToBeFetched: Record<string, FormEvalOutput> = {};

    Object.entries(triggers).forEach(([key, value]) => {
      if (action.payload.keys.includes(key)) {
        const existingValue = value as FormEvalOutput;
        const newValue = {
          ...existingValue,
          fetchDynamicValues: {
            ...(existingValue.fetchDynamicValues || {}),
            isLoading: action.payload.value,
          },
        };

        triggersToBeFetched[key] = newValue;
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
