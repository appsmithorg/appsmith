import { getFormValues, isValid, getFormInitialValues } from "redux-form";
import { AppState } from "reducers";
import { ActionData } from "reducers/entityReducers/actionsReducer";

type GetFormData = (
  state: AppState,
  formName: string,
) => { initialValues: any; values: any; valid: boolean };

export const getFormData: GetFormData = (state, formName) => {
  const initialValues = getFormInitialValues(formName)(state);
  const values = getFormValues(formName)(state);
  const valid = isValid(formName)(state);
  return { initialValues, values, valid };
};

export const getApiName = (state: AppState, id: string) => {
  return state.entities.actions.find(
    (action: ActionData) => action.config.id === id,
  )?.config.name;
};

export const getFormEvaluationState = (state: AppState) =>
  state.evaluations.formEvaluation;
