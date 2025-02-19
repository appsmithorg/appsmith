import { call, put, select } from "redux-saga/effects";
import fetchGlobalProfileRequest from "../requests/fetchGlobalProfileRequest";
import type { FetchGlobalProfileResponse } from "../requests/fetchGlobalProfileRequest.types";

// internal dependencies
import { validateResponse } from "sagas/ErrorSagas";
import { gitGlobalActions } from "git/store/gitGlobalSlice";
import handleApiErrors from "./helpers/handleApiErrors";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";

export default function* fetchGlobalProfileSaga() {
  let response: FetchGlobalProfileResponse | undefined;

  try {
    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(fetchGlobalProfileRequest, isGitApiContractsEnabled);

    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(
        gitGlobalActions.fetchGlobalProfileSuccess({
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(gitGlobalActions.fetchGlobalProfileError({ error }));
    }
  }
}
