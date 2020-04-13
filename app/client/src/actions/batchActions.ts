import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

export const batchAction = (action: ReduxAction<any>) => ({
  type: ReduxActionTypes.BATCHED_UPDATE,
  payload: action,
});

export type BatchAction<T> = ReduxAction<ReduxAction<T>>;
