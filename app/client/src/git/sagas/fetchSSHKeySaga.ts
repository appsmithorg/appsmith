import fetchSSHKeyRequest from "git/requests/fetchSSHKeyRequest";
import type { FetchSSHKeyResponse } from "git/requests/fetchSSHKeyRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import type { GitArtifactPayloadAction } from "git/store/types";
import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import handleApiErrors from "./helpers/handleApiErrors";

export function* fetchSSHKeySaga(action: GitArtifactPayloadAction) {
  const { artifactDef } = action.payload;
  let response: FetchSSHKeyResponse | undefined;

  try {
    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      fetchSSHKeyRequest,
      artifactDef.artifactType,
      artifactDef.baseArtifactId,
      isGitApiContractsEnabled,
    );
    const isValidResponse: boolean = yield validateResponse(response, false);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.fetchSSHKeySuccess({
          artifactDef,
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(gitArtifactActions.fetchSSHKeyError({ artifactDef, error }));
    }
  }
}
