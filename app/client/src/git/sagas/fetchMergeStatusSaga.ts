import { captureException } from "@sentry/react";
import fetchMergeStatusRequest from "git/requests/fetchMergeStatusRequest";
import type {
  FetchMergeStatusRequestParams,
  FetchMergeStatusResponse,
} from "git/requests/fetchMergeStatusRequest.types";
import type { FetchMergeStatusInitPayload } from "git/store/actions/fetchMergeStatusActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import type { GitArtifactPayloadAction } from "git/store/types";
import log from "loglevel";
import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";

export default function* fetchMergeStatusSaga(
  action: GitArtifactPayloadAction<FetchMergeStatusInitPayload>,
) {
  const { artifactDef, artifactId } = action.payload;
  let response: FetchMergeStatusResponse | undefined;

  try {
    const params: FetchMergeStatusRequestParams = {
      destinationBranch: action.payload.destinationBranch,
      sourceBranch: action.payload.sourceBranch,
    };

    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      fetchMergeStatusRequest,
      artifactDef.artifactType,
      artifactId,
      params,
      isGitApiContractsEnabled,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.fetchMergeStatusSuccess({
          artifactDef,
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(
        gitArtifactActions.fetchMergeStatusError({ artifactDef, error }),
      );
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
