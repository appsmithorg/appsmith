import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { SetCrudInfoModalOpenPayload } from "actions/crudInfoModalActions";
import type { CrudInfoModalReduxState, GenerateCRUDSuccessInfoData } from "./crudInfoModalReducer.types";

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

export default crudInfoModalReducer;
