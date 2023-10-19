export interface AnvilReduxAction<T> {
  type: AnvilReduxActionTypes;
  payload: T;
}

export enum AnvilReduxActionTypes {
  READ_LAYOUT_ELEMENT_POSITIONS = "READ_LAYOUT_ELEMENT_POSITIONS",
  UPDATE_LAYOUT_ELEMENT_POSITIONS = "UPDATE_LAYOUT_ELEMENT_POSITIONS",
}
