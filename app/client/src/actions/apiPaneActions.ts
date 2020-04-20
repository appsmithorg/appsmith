import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

export const changeApi = (id: string): ReduxAction<{ id: string }> => {
  return {
    type: ReduxActionTypes.API_PANE_CHANGE_API,
    payload: { id },
  };
};

export const initApiPane = (urlId?: string): ReduxAction<{ id?: string }> => {
  return {
    type: ReduxActionTypes.INIT_API_PANE,
    payload: { id: urlId },
  };
};

export const createNewApiAction = (
  pageId: string,
): ReduxAction<{ pageId: string }> => ({
  type: ReduxActionTypes.CREATE_NEW_API_ACTION,
  payload: { pageId },
});
