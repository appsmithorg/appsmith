import fetchMetadataRequest from "git/requests/fetchMetadataRequest";
import type { FetchMetadataResponse } from "git/requests/fetchMetadataRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import type { GitArtifactPayloadAction } from "git/store/types";
import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import handleApiErrors from "./helpers/handleApiErrors";

export default function* fetchMetadataSaga(action: GitArtifactPayloadAction) {
  const { artifactDef } = action.payload;
  let response: FetchMetadataResponse | undefined;

  try {
    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      fetchMetadataRequest,
      artifactDef.artifactType,
      artifactDef.baseArtifactId,
      isGitApiContractsEnabled,
    );
    const isValidResponse: boolean = yield validateResponse(response, false);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.fetchMetadataSuccess({
          artifactDef,
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(gitArtifactActions.fetchMetadataError({ artifactDef, error }));
    }
  }
}
