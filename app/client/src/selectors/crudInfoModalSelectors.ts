import type { DefaultRootState } from "react-redux";
import { createSelector } from "reselect";
import type {
  CrudInfoModalReduxState,
  GenerateCRUDSuccessInfoData,
} from "reducers/uiReducers/crudInfoModalReducer";

export interface CrudInfoModalData {
  crudInfoModalOpen: boolean;
  generateCRUDSuccessInfo: GenerateCRUDSuccessInfoData | null;
}

const getCrudInfoModalState = (
  state: DefaultRootState,
): CrudInfoModalReduxState => state.ui.crudInfoModal;

export const getCrudInfoModalData = createSelector(
  getCrudInfoModalState,
  (crudInfoModal) => {
    return {
      crudInfoModalOpen: crudInfoModal.crudInfoModalOpen,
      generateCRUDSuccessInfo: crudInfoModal.generateCRUDSuccessInfo,
    };
  },
);
