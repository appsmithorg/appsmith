import { getFormValues, isDirty, isValid } from "redux-form";
import { AppState } from "../reducers";

type GetFormData = (
  state: AppState,
  formName: string,
) => { values: object; dirty: boolean; valid: boolean };

export const getFormData: GetFormData = (state, formName) => {
  const values = getFormValues(formName)(state);
  const dirty = isDirty(formName)(state);
  const valid = isValid(formName)(state);
  return { values, dirty, valid };
};
