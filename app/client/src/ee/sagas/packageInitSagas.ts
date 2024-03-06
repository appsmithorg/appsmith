import { all, put, call, takeLatest } from "redux-saga/effects";

import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import PackageEditorEngine from "@appsmith/entities/Engine/PackageEditorEngine";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { InitPackageEditorPayload } from "@appsmith/actions/packageInitActions";

export function* startPackageEngine(
  action: ReduxAction<InitPackageEditorPayload>,
) {
  try {
    const packageEngine = new PackageEditorEngine();

    yield call(packageEngine.setupEngine);
    yield call(packageEngine.loadPackage, action.payload.packageId);
    yield call(packageEngine.loadPluginsAndDatasources);
    yield call(packageEngine.completeChore);
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.INITIALIZE_PACKAGE_EDITOR_ERROR,
      payload: {
        error,
      },
    });
  }
}

export default function* watchPackageInitSagas() {
  yield all([
    takeLatest(ReduxActionTypes.INITIALIZE_PACKAGE_EDITOR, startPackageEngine),
  ]);
}
