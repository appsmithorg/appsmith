import { setReopenExplorerOnSettingsCloseAction } from "actions/appSettingsPaneActions";
import {
  setExplorerActiveAction,
  setExplorerPinnedAction,
} from "actions/explorerActions";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { all, put, select, takeLatest } from "redux-saga/effects";
import { getReopenExplorerOnSettingsPaneClose } from "selectors/appSettingsPaneSelectors";
import { getExplorerPinned } from "selectors/explorerSelector";

export function* openAppSettingsPaneSaga() {
  const isEntityExplorerPinned: boolean = yield select(getExplorerPinned);
  if (isEntityExplorerPinned) {
    yield put(setExplorerActiveAction(false));
    yield put(setExplorerPinnedAction(false));
    yield put(setReopenExplorerOnSettingsCloseAction(true));
  }
}

export function* closeSettingsPaneSaga() {
  const reopenExplorer: boolean = yield select(
    getReopenExplorerOnSettingsPaneClose,
  );
  if (reopenExplorer) {
    yield put(setExplorerPinnedAction(true));
    yield put(setReopenExplorerOnSettingsCloseAction(false));
  }
}

export default function* root() {
  yield all([
    takeLatest(
      ReduxActionTypes.OPEN_APP_SETTINGS_PANE,
      openAppSettingsPaneSaga,
    ),
    takeLatest(ReduxActionTypes.CLOSE_APP_SETTINGS_PANE, closeSettingsPaneSaga),
  ]);
}
