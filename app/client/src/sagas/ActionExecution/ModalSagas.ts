import { put } from "redux-saga/effects";
import AppsmithConsole from "utils/AppsmithConsole";
import { ActionValidationError } from "sagas/ActionExecution/errorUtils";
import { getType, Types } from "utils/TypeHelpers";
import type {
  TCloseModalDescription,
  TShowModalDescription,
} from "workers/Evaluation/fns/modalFns";

export function* openModalSaga(action: TShowModalDescription) {
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
    text: `showModal('${modalName ?? ""}') was triggered`,
  });
}

export function* closeModalSaga(action: TCloseModalDescription) {
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
