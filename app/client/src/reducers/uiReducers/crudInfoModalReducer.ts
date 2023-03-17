import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { SetCrudInfoModalOpenPayload } from "actions/crudInfoModalActions";

const initialState: CrudInfoModalReduxState = {
  crudInfoModalOpen: false,
  generateCRUDSuccessInfo: null,
};

const crudInfoModalReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_CRUD_INFO_MODAL_OPEN]: (
    state: CrudInfoModalReduxState,
    action: ReduxAction<SetCrudInfoModalOpenPayload>,
  ) => {
    return {
      ...state,
      crudInfoModalOpen: action.payload.open,
      generateCRUDSuccessInfo: action.payload.generateCRUDSuccessInfo,
    };
  },
});

export type GenerateCRUDSuccessInfoData = {
  successImageUrl: string;
  successMessage: string;
};

export interface CrudInfoModalReduxState {
  crudInfoModalOpen: boolean;
  generateCRUDSuccessInfo: GenerateCRUDSuccessInfoData | null;
}

export default crudInfoModalReducer;
