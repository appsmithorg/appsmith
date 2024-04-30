import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { call, select } from "redux-saga/effects";
import { getIsAnvilLayout } from "../selectors";

export function* callSagaOnlyForAnvil(saga: any, action: ReduxAction<unknown>) {
  const isAnvilLayout: boolean = yield select(getIsAnvilLayout);
  if (isAnvilLayout) {
    yield call(saga, action);
  }
}
