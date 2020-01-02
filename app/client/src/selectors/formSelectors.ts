import { getFormValues, isValid } from "redux-form";
import { AppState } from "reducers";
import { RestAction } from "api/ActionAPI";

type GetFormData = (
  state: AppState,
  formName: string,
) => { values: object; dirty: boolean; valid: boolean };

export const getFormData: GetFormData = (state, formName) => {
  const values = getFormValues(formName)(state) as RestAction;
  const drafts = state.ui.apiPane.drafts;
  const dirty = values.id in drafts;
  const valid = isValid(formName)(state);
  return { values, dirty, valid };
};
