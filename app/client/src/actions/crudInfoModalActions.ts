import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const setCrudInfoModalOpen = (payload: boolean) => {
  return {
    type: ReduxActionTypes.SET_CRUD_INFO_MODAL_OPEN,
    payload,
  };
};
