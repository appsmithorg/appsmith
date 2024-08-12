import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export interface SetCrudInfoModalOpenPayload {
  open: boolean;
  generateCRUDSuccessInfo?: {
    successImageUrl: string;
    successMessage: string;
  };
}

export const setCrudInfoModalData = (payload: SetCrudInfoModalOpenPayload) => {
  return {
    type: ReduxActionTypes.SET_CRUD_INFO_MODAL_OPEN,
    payload,
  };
};
