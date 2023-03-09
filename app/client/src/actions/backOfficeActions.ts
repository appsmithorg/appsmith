import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";

export const setIsBackOfficeConnected = (payload: boolean) => {
  return {
    type: ReduxActionTypes.SET_IS_BACK_OFFICE_CONNECTED,
    payload,
  };
};

export const setIsBackOfficeModalOpen = (payload: boolean) => {
  return {
    type: ReduxActionTypes.SET_IS_BACK_OFFICE_MODAL_OPEN,
    payload,
  };
};
