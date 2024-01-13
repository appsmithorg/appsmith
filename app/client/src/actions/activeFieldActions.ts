import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const setActiveEditorField = (field: string) => ({
  type: ReduxActionTypes.SET_ACTIVE_EDITOR_FIELD,
  payload: { field },
});
export const resetActiveEditorField = () => ({
  type: ReduxActionTypes.RESET_ACTIVE_EDITOR_FIELD,
});
