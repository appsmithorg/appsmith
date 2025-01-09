import type { ReduxAction } from "./ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { EvaluationReduxAction } from "./EvaluationReduxActionTypes";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const batchAction = (action: EvaluationReduxAction<any>) => ({
  type: ReduxActionTypes.BATCHED_UPDATE,
  payload: action,
});

export type BatchAction<T> = ReduxAction<EvaluationReduxAction<T>>;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const batchActionSuccess = (actions: ReduxAction<any>[]) => ({
  type: ReduxActionTypes.BATCH_UPDATES_SUCCESS,
  payload: actions,
});
