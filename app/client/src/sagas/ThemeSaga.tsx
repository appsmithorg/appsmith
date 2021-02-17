import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { takeLatest } from "redux-saga/effects";
import localStorage from "utils/localStorage";
import { ThemeMode } from "../selectors/themeSelectors";

export function* setThemeSaga(actionPayload: ReduxAction<ThemeMode>) {
  yield localStorage.setItem("THEME", actionPayload.payload);
}

export default function* themeSagas() {
  yield takeLatest(ReduxActionTypes.SET_THEME, setThemeSaga);
}
