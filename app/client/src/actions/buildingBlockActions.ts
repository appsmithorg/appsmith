import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const openCreateBuildingBlockModal = (payload: boolean) => {
  return {
    type: ReduxActionTypes.CREATE_BUILDING_BLOCK_MODAL_OPEN,
    payload,
  };
};
