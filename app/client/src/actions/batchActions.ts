import {
  EvaluationReduxAction,
  ReduxAction,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";

export const batchAction = (action: EvaluationReduxAction<any>) => ({
  type: ReduxActionTypes.BATCHED_UPDATE,
  payload: action,
});

export type BatchAction<T> = ReduxAction<EvaluationReduxAction<T>>;

export const batchActionSuccess = (actions: ReduxAction<any>[]) => ({
  type: ReduxActionTypes.BATCH_UPDATES_SUCCESS,
  payload: actions,
});
