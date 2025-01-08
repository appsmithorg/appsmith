import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { FormConfigType } from "components/formControls/BaseControl";
import type {
  FormEvaluationState,
  FetchPageActionPayload,
} from "./formEvaluationReducer.types";

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
