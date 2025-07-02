import { put } from "redux-saga/effects";
import AppsmithConsole from "utils/AppsmithConsole";
import { ActionValidationError } from "sagas/ActionExecution/errorUtils";
import { getType, Types } from "utils/TypeHelpers";
import type {
  TCloseModalDescription,
  TShowModalDescription,
} from "workers/Evaluation/fns/modalFns";
import type { SourceEntity } from "entities/AppsmithConsole";

export function* openModalSaga(
  action: TShowModalDescription,
  source?: SourceEntity,
) {
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
    source,
    text: `showModal triggered`,
    state: {
      modalName,
    },
  });
}

export function* closeModalSaga(
  action: TCloseModalDescription,
  source?: SourceEntity,
) {
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
    source,
    text: `closeModal triggered`,
    state: {
      modalName,
    },
  });
}
