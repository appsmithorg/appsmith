import fetchStatusRequest from "git/requests/fetchStatusRequest";
import type { FetchStatusResponse } from "git/requests/fetchStatusRequest.types";
import type { FetchStatusInitPayload } from "git/store/actions/fetchStatusActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import type { GitArtifactPayloadAction } from "git/store/types";
import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import handleApiErrors from "./helpers/handleApiErrors";

export default function* fetchStatusSaga(
  action: GitArtifactPayloadAction<FetchStatusInitPayload>,
) {
  const { artifactDef, artifactId } = action.payload;
  let response: FetchStatusResponse | undefined;

  try {
    const params = { compareRemote: true };
    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      fetchStatusRequest,
      artifactDef.artifactType,
      artifactId,
      params,
      isGitApiContractsEnabled,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.fetchStatusSuccess({
          artifactDef,
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(gitArtifactActions.fetchStatusError({ artifactDef, error }));
    }

    // ! case: better error handling than passing strings
    // if ((error as Error)?.message?.includes("Auth fail")) {
    //   payload.error = new Error(createMessage(ERROR_GIT_AUTH_FAIL));
    // } else if ((error as Error)?.message?.includes("Invalid remote: origin")) {
    //   payload.error = new Error(createMessage(ERROR_GIT_INVALID_REMOTE));
    // }
  }
}
