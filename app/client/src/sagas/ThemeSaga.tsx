import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { takeLatest } from "redux-saga/effects";
import { ThemeMode } from "reducers/uiReducers/themeReducer";

export function* setThemeSaga(actionPayload: ReduxAction<ThemeMode>) {
  localStorage.setItem("THEME", actionPayload.payload);
}

export default function* themeSagas() {
  yield takeLatest(ReduxActionTypes.SET_THEME, setThemeSaga);
}
