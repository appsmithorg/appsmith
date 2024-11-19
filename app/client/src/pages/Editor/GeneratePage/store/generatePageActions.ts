import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { GeneratePageModalParams } from "reducers/entityReducers/pageListReducer";

export const openGeneratePageModal = (payload?: GeneratePageModalParams) => {
  return {
    type: ReduxActionTypes.SET_GENERATE_PAGE_MODAL_OPEN,
    payload,
  };
};

export const closeGeneratePageModal = () => {
  return {
    type: ReduxActionTypes.SET_GENERATE_PAGE_MODAL_CLOSE,
  };
};
