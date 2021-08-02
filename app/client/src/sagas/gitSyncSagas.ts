import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { all, call, put, takeLatest } from "redux-saga/effects";
import GitSynApi from "api/GitSyncAPI";
import { ApiResponse } from "api/ApiResponses";
import { validateResponse } from "./ErrorSagas";
import {
  fetchRepoDetailsError,
  fetchRepoDetailsSuccess,
} from "actions/gitSyncActions";

export function* fetchGitRepoDetails() {
  try {
    const response: ApiResponse = yield call(GitSynApi.fetchRepoDetails);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put(fetchRepoDetailsSuccess(response.data));
    }
  } catch (error) {
    yield put(fetchRepoDetailsError(error));
  }
}

export default function* orgSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_GIT_REPO_DETAILS_INIT,
      fetchGitRepoDetails,
    ),
  ]);
}
