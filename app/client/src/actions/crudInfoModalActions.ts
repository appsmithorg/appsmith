import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const setCrudInfoModal = (payload: boolean) => {
  return {
    type: ReduxActionTypes.SET_CRUD_INFO_MODAL_OPEN,
    payload,
  };
};
