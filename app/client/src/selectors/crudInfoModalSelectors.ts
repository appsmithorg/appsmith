import { AppState } from "reducers";
import { createSelector } from "reselect";
import {
  CrudInfoModalReduxState,
  GenerateCRUDSuccessInfoData,
} from "reducers/uiReducers/crudInfoModalReducer";

export type CrudInfoModalData = {
  crudInfoModalOpen: boolean;
  generateCRUDSuccessInfo: GenerateCRUDSuccessInfoData | null;
};

const getCrudInfoModalState = (state: AppState): CrudInfoModalReduxState =>
  state.ui.crudInfoModal;

export const getCrudInfoModalData = createSelector(
  getCrudInfoModalState,
  (crudInfoModal) => {
    return {
      crudInfoModalOpen: crudInfoModal.crudInfoModalOpen,
      generateCRUDSuccessInfo: crudInfoModal.generateCRUDSuccessInfo,
    };
  },
);
