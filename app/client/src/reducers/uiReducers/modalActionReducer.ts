import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

const initialState: ModalActionReduxState = {
  modals: [],
};

const modalActionReducer = createReducer(initialState, {
  [ReduxActionTypes.SHOW_ACTION_MODAL]: (
    state: ModalActionReduxState,
    action: ReduxAction<ModalInfo>,
  ) => {
    const filteredState = state.modals.filter(
      (modalInfo) => modalInfo.name !== action.payload.name,
    );

    return { ...state, modals: [...filteredState, action.payload] };
  },
});

import { ModalType } from "./modalActionReducer.types";
import type { ModalInfo, ModalActionReduxState } from "./modalActionReducer.types";

export default modalActionReducer;
