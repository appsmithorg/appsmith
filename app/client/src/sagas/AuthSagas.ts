import { all, takeEvery, select, put } from "redux-saga/effects";
import { getFormValues } from "redux-form";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { LOGIN_FORM_NAME } from "constants/forms";
import history from "utils/history";
import axios from "axios";
import qs from "qs";
import { BASE_LOGIN_URL } from "constants/routes";
import { getCurrentUser } from "actions/authActions";

const loginAxios = axios.create({
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "text/html",
  },
  withCredentials: true,
});

function* formLoginSaga() {
  const values: Record<string, string> = yield select(
    getFormValues(LOGIN_FORM_NAME),
  );
  const formData = qs.stringify(values);
  const base = window.location.origin;

  const response = yield loginAxios({
    method: "POST",
    url: `/api/v1${BASE_LOGIN_URL}`,
    data: formData,
    headers: {
      "X-Redirect-Url": `${base}/applications`,
    },
  });
  yield put(getCurrentUser({}));
  const url = response.request.responseURL.replace(base, "");
  history.replace(url);
}

export default function* watchAuthSagas() {
  yield all([takeEvery(ReduxActionTypes.FORM_LOGIN_INIT, formLoginSaga)]);
}
