import { createMessage, customJSLibraryMessages } from "ce/constants/messages";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { Toaster, Variant } from "design-system";
import {
  actionChannel,
  ActionPattern,
  all,
  call,
  put,
  take,
  takeEvery,
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
  const versionMatch = url.match(/(?<=@)(\d+\.)(\d+\.)(\d+)/);

  const [version] = versionMatch ? versionMatch : [];

  yield put({
    type: ReduxActionTypes.INSTALL_LIBRARY_SUCCESS,
    payload: { url, libraryAccessor, version },
  });
  Toaster.show({
    text: createMessage(
      customJSLibraryMessages.INSTALLATION_SUCCESSFUL,
      libraryAccessor,
    ),
    variant: Variant.success,
  });
}

function* uninstallLibrary(
  action: ReduxAction<{ accessor: string; name: string; url: string }>,
) {
  const { accessor, name } = action.payload;
  const success: boolean = yield call(
    EvalWorker.request,
    EVAL_WORKER_ACTIONS.UNINSTALL_LIBRARY,
    accessor,
  );
  if (!success) {
    Toaster.show({
      text: createMessage(customJSLibraryMessages.UNINSTALL_FAILED, name),
      variant: Variant.danger,
    });
  }
}

function* startInstallationRequestChannel() {
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

export default function*() {
  yield all([
    takeEvery(ReduxActionTypes.UNINSTALL_LIBRARY_INIT, uninstallLibrary),
    call(startInstallationRequestChannel),
  ]);
}
