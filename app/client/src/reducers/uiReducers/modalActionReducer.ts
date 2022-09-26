import { createReducer } from "utils/ReducerUtils";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";

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

// different types of operations that involve using modals
export enum ModalType {
  RUN_ACTION = "RUN_ACTION",
}

// some meta-data about the Modal.
export type ModalInfo = {
  name: string;
  modalOpen: boolean;
  modalType: ModalType;
};
export interface ModalActionReduxState {
  modals: ModalInfo[];
}

export default modalActionReducer;
