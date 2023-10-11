export interface AnvilReduxAction<T> {
  type: AnvilReduxActionTypes;
  payload: T;
}

export enum AnvilReduxActionTypes {
  READ_WIDGET_POSITIONS = "READ_WIDGET_POSITIONS",
  UPDATE_WIDGET_POSITIONS = "UPDATE_WIDGET_POSITIONS",
}
