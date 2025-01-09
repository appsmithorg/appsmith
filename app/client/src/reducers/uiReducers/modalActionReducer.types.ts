// different types of operations that involve using modals
export enum ModalType {
  RUN_ACTION = "RUN_ACTION",
}

// some meta-data about the Modal.
export interface ModalInfo {
  name: string;
  modalOpen: boolean;
  modalType: ModalType;
}

export interface ModalActionReduxState {
  modals: ModalInfo[];
}
