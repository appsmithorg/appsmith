import { captureException } from "@sentry/react";
import fetchProtectedBranchesRequest from "git/requests/fetchProtectedBranchesRequest";
import type { FetchProtectedBranchesResponse } from "git/requests/fetchProtectedBranchesRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import type { GitArtifactPayloadAction } from "git/store/types";
import log from "loglevel";
import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";

export default function* fetchProtectedBranchesSaga(
  action: GitArtifactPayloadAction,
) {
  const { artifactDef } = action.payload;
  let response: FetchProtectedBranchesResponse | undefined;

  try {
    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      fetchProtectedBranchesRequest,
      artifactDef.artifactType,
      artifactDef.baseArtifactId,
      isGitApiContractsEnabled,
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.fetchProtectedBranchesSuccess({
          artifactDef,
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(
        gitArtifactActions.fetchProtectedBranchesError({
          artifactDef,
          error,
        }),
      );
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
