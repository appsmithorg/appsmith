import { captureException } from "@sentry/react";
import fetchSSHKeyRequest from "git/requests/fetchSSHKeyRequest";
import type { FetchSSHKeyResponse } from "git/requests/fetchSSHKeyRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "git/store/types";
import log from "loglevel";
import { call, put } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";

export function* fetchSSHKeySaga(action: GitArtifactPayloadAction) {
  const { artifactDef } = action.payload;
  let response: FetchSSHKeyResponse | undefined;

  try {
    response = yield call(fetchSSHKeyRequest, artifactDef.baseArtifactId);
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
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(gitArtifactActions.fetchSSHKeyError({ artifactDef, error }));
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
