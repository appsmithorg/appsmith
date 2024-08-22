import { showActionConfirmationModal } from "actions/pluginActionActions";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { ModalInfo } from "reducers/uiReducers/modalActionReducer";
import { put, race, take } from "redux-saga/effects";

export function* requestModalConfirmationSaga(payload: ModalInfo) {
  yield put(showActionConfirmationModal(payload));

  const { accept } = yield race({
    cancel: take(ReduxActionTypes.CANCEL_ACTION_MODAL + `_FOR_${payload.name}`),
    accept: take(
      ReduxActionTypes.CONFIRM_ACTION_MODAL + `_FOR_${payload.name}`,
    ),
  });

  return !!accept;
}
