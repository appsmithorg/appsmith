import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const setActiveEditorField = (field: string) => ({
  type: ReduxActionTypes.SET_ACTIVE_EDITOR_FIELD,
  payload: { field },
});
export const resetActiveEditorField = () => ({
  type: ReduxActionTypes.RESET_ACTIVE_EDITOR_FIELD,
});

export const setCursorOnMount = (payload: string) => ({
  type: ReduxActionTypes.SET_CURSOR_ON_MOUNT_PATH,
  payload,
});
