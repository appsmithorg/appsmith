import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

export type FormEvaluationState = Record<string, any>;

const initialState: FormEvaluationState = {};

const formEvaluation = createReducer(initialState, {
  [ReduxActionTypes.SET_FORM_EVALUATION]: (
    state: FormEvaluationState,
    action: ReduxAction<Set<string>>,
  ): FormEvaluationState => action.payload,
  [ReduxActionTypes.FETCH_PAGE_INIT]: () => initialState,
});

export default formEvaluation;
