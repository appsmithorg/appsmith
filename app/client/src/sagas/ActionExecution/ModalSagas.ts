import {
  CloseModalActionDescription,
  ShowModalActionDescription,
} from "entities/DataTree/actionTriggers";
import { put } from "redux-saga/effects";
import AppsmithConsole from "utils/AppsmithConsole";

export function* openModalSaga(action: ShowModalActionDescription) {
  yield put(action);
}

export function* closeModalSaga(action: CloseModalActionDescription) {
  yield put(action);
  AppsmithConsole.info({
    text: `closeModal(${action.payload.modalName}) was triggered`,
  });
}
