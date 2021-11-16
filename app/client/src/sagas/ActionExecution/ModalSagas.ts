import {
  ActionTriggerType,
  CloseModalActionDescription,
  ShowModalActionDescription,
} from "entities/DataTree/actionTriggers";
import { put } from "redux-saga/effects";
import AppsmithConsole from "utils/AppsmithConsole";
import { ActionValidationError } from "sagas/ActionExecution/errorUtils";
import { getType, Types } from "utils/TypeHelpers";
import { TriggerMeta } from "sagas/ActionExecution/ActionExecutionSagas";

export function* openModalSaga(
  action: ShowModalActionDescription,
  triggerMeta: TriggerMeta,
) {
  const { modalName } = action.payload;
  if (typeof modalName !== "string") {
    throw new ActionValidationError(
      ActionTriggerType.SHOW_MODAL_BY_NAME,
      "name",
      Types.STRING,
      getType(modalName),
      triggerMeta,
    );
  }
  yield put(action);
  AppsmithConsole.info({
    text: `openModal(${modalName}) was triggered`,
  });
}

export function* closeModalSaga(
  action: CloseModalActionDescription,
  triggerMeta: TriggerMeta,
) {
  const { modalName } = action.payload;
  if (typeof modalName !== "string") {
    throw new ActionValidationError(
      ActionTriggerType.CLOSE_MODAL,
      "name",
      Types.STRING,
      getType(modalName),
      triggerMeta,
    );
  }
  yield put(action);
  AppsmithConsole.info({
    text: `closeModal(${modalName}) was triggered`,
  });
}
