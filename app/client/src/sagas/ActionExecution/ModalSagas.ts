import {
  CloseModalActionDescription,
  ShowModalActionDescription,
} from "@appsmith/entities/DataTree/actionTriggers";
import { put } from "redux-saga/effects";
import AppsmithConsole from "utils/AppsmithConsole";
import { ActionValidationError } from "sagas/ActionExecution/errorUtils";
import { getType, Types } from "utils/TypeHelpers";

export function* openModalSaga(action: ShowModalActionDescription) {
  const { modalName } = action.payload;
  if (typeof modalName !== "string") {
    throw new ActionValidationError(
      "SHOW_MODAL_BY_NAME",
      "name",
      Types.STRING,
      getType(modalName),
    );
  }
  yield put(action);
  AppsmithConsole.info({
    text: `openModal(${modalName}) was triggered`,
  });
}

export function* closeModalSaga(action: CloseModalActionDescription) {
  const { modalName } = action.payload;
  if (typeof modalName !== "string") {
    throw new ActionValidationError(
      "CLOSE_MODAL",
      "name",
      Types.STRING,
      getType(modalName),
    );
  }
  yield put(action);
  AppsmithConsole.info({
    text: `closeModal(${modalName}) was triggered`,
  });
}
