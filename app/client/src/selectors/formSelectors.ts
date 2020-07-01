import { getFormValues, isValid, getFormInitialValues } from "redux-form";
import { AppState } from "reducers";
import { RestAction } from "entities/Action";
import { ActionData } from "reducers/entityReducers/actionsReducer";

type GetFormData = (
  state: AppState,
  formName: string,
) => { values: object; dirty: boolean; valid: boolean };

export const getFormData: GetFormData = (state, formName) => {
  const initialValues = getFormInitialValues(formName)(state) as RestAction;
  const values = getFormValues(formName)(state) as RestAction;
  const drafts = state.entities.actionDrafts;
  const dirty = values.id in drafts;
  const valid = isValid(formName)(state);
  return { initialValues, values, dirty, valid };
};

export const getApiName = (state: AppState, id: string) => {
  return state.entities.actions.find(
    (action: ActionData) => action.config.id === id,
  )?.config.name;
};
