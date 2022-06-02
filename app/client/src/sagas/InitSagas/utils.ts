import { get } from "lodash";
import { all, put, race, take } from "redux-saga/effects";
import { ReduxActionTypes } from "../../ce/constants/ReduxActionConstants";
import { ERROR_CODES } from "../../ce/constants/ApiConstants";
import {
  ReduxAction,
  ReduxActionWithoutPayload,
} from "@appsmith/constants/ReduxActionConstants";

export function* failFastApiCalls(
  triggerActions:
    | Array<ReduxAction<unknown> | ReduxActionWithoutPayload>
    | Array<any>,
  successActions: string[],
  failureActions: string[],
) {
  const triggerEffects = [];
  for (const triggerAction of triggerActions) {
    triggerEffects.push(triggerAction);
  }

  yield all(triggerEffects.map((triggerAction) => put(triggerAction)));

  const successEffects = [];
  for (const successAction of successActions) {
    successEffects.push(successAction);
  }
  const effectRaceResult = yield race({
    success: all(successEffects.map((successAction) => take(successAction))),
    failure: take(failureActions),
  });
  if (effectRaceResult.failure) {
    yield put({
      type: ReduxActionTypes.SAFE_CRASH_APPSMITH_REQUEST,
      payload: {
        code: get(
          effectRaceResult,
          "failure.payload.error.code",
          ERROR_CODES.SERVER_ERROR,
        ),
      },
    });
    return false;
  }
  return true;
}
