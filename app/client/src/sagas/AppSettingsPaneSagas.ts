import { setReopenExplorerOnSettingsCloseAction } from "actions/appSettingsPaneActions";
import {
  setExplorerActiveAction,
  setExplorerPinnedAction,
} from "actions/explorerActions";
import {
  SelectMultipleWidgetsActionPayload,
  SelectWidgetActionPayload,
} from "actions/widgetSelectionActions";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
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

export function* closeSettingsPaneSaga(
  action?:
    | ReduxAction<SelectMultipleWidgetsActionPayload> // SELECT_MULTIPLE_WIDGETS
    | ReduxAction<SelectWidgetActionPayload> // SELECT_WIDGET
    | ReduxAction<undefined>, // CLOSE_APP_SETTINGS_PANE
) {
  // select multiple widgets is triggered also on canvas click
  // checking widgets length to ensure widgets were selected
  if (
    (action as ReduxAction<SelectMultipleWidgetsActionPayload>)?.payload
      ?.widgetIds?.length === 0
  )
    return;

  // select widget is also triggered on route change
  // checking widget id to ensure a widget was selected
  if (!(action as ReduxAction<SelectWidgetActionPayload>)?.payload?.widgetId)
    return;

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
    takeLatest(ReduxActionTypes.SELECT_WIDGET, closeSettingsPaneSaga),
    takeLatest(ReduxActionTypes.SELECT_MULTIPLE_WIDGETS, closeSettingsPaneSaga),
  ]);
}
