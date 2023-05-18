import type { AppState } from "@appsmith/reducers";
import { createSelector } from "reselect";
import type {
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
