import { all, takeEvery, select, put } from "redux-saga/effects";
import { getFormValues } from "redux-form";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { LOGIN_FORM_NAME } from "constants/forms";
import history from "utils/history";
import qs from "qs";
import { getCurrentUser } from "actions/authActions";
import AuthApi from "@appsmith/api/AuthApi";

function* formLoginSaga() {
  const values: Record<string, string> = yield select(
    getFormValues(LOGIN_FORM_NAME),
  );
  const formData = qs.stringify(values);
  const base = window.location.origin;
  const response = yield AuthApi.formLogin(formData, `${base}/applications`);
  yield put(getCurrentUser({}));
  const url = response.request.responseURL.replace(base, "");
  history.replace(url);
}

export default function* watchAuthSagas() {
  yield all([takeEvery(ReduxActionTypes.FORM_LOGIN_INIT, formLoginSaga)]);
}
