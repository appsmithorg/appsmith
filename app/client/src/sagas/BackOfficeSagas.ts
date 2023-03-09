import { setIsBackOfficeModalOpen } from "actions/backOfficeActions";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { TakeableChannel } from "redux-saga";
import { actionChannel, call, fork, put, take } from "redux-saga/effects";

function* showConnectBackOfficeModal() {
  yield put(setIsBackOfficeModalOpen(true));
}
const backOfficeActions: Record<
  typeof ReduxActionTypes[keyof typeof ReduxActionTypes],
  (...args: any[]) => any
> = {
  [ReduxActionTypes.SET_IS_BACK_OFFICE_MODAL_OPEN]: showConnectBackOfficeModal,
};

function* watchBackOfficeRequests() {
  const backOfficeChannel: TakeableChannel<unknown> = yield actionChannel(
    Object.keys(backOfficeActions),
  );

  while (true) {
    const { type, ...args }: ReduxAction<unknown> = yield take(
      backOfficeChannel,
    );
    yield call(backOfficeActions[type], { type, ...args });
  }
}

export default function* backOfficeSagas() {
  yield fork(watchBackOfficeRequests);
}
