import { createMessage, customJSLibraryMessages } from "ce/constants/messages";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { Variant } from "components/ads";
import { Toaster } from "design-system";
import {
  actionChannel,
  ActionPattern,
  call,
  put,
  take,
} from "redux-saga/effects";
import TernServer from "utils/autocomplete/TernServer";
import { EVAL_WORKER_ACTIONS } from "utils/DynamicBindingUtils";
import { EvalWorker } from "./EvaluationsSaga";

export function* installLibrary(url: string) {
  const { defs, libraryAccessor, status } = yield call(
    EvalWorker.request,
    EVAL_WORKER_ACTIONS.INSTALL_LIBRARY,
    url,
  );
  if (!status) {
    yield put({
      type: ReduxActionTypes.INSTALL_LIBRARY_FAILED,
      payload: url,
    });
    Toaster.show({
      text: createMessage(customJSLibraryMessages.INSTALLATION_FAILED),
      variant: Variant.danger,
    });
    return;
  }
  TernServer.updateDef(defs["!name"], defs);
  yield put({
    type: ReduxActionTypes.INSTALL_LIBRARY_SUCCESS,
    payload: { url, libraryAccessor },
  });
  Toaster.show({
    text: createMessage(
      customJSLibraryMessages.INSTALLATION_SUCCESSFUL,
      libraryAccessor,
    ),
    variant: Variant.success,
  });
}

export default function*() {
  const queueInstallChannel: ActionPattern<any> = yield actionChannel([
    ReduxActionTypes.INSTALL_LIBRARY_INIT,
  ]);
  while (true) {
    const action: ReduxAction<string> = yield take(queueInstallChannel);
    yield put({
      type: ReduxActionTypes.INSTALL_LIBRARY_START,
      payload: action.payload,
    });
    yield call(installLibrary, action.payload);
  }
}
