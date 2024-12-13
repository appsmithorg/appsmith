import { captureException } from "@sentry/react";
import fetchStatusRequest from "git/requests/fetchStatusRequest";
import type { FetchStatusResponse } from "git/requests/fetchStatusRequest.types";
import type { FetchStatusInitPayload } from "git/store/actions/fetchStatusActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "git/store/types";
import log from "loglevel";
import { call, put } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";

export default function* fetchStatusSaga(
  action: GitArtifactPayloadAction<FetchStatusInitPayload>,
) {
  const { artifactType, baseArtifactId } = action.payload;
  const basePayload = { artifactType, baseArtifactId };
  let response: FetchStatusResponse | undefined;

  try {
    response = yield call(fetchStatusRequest, baseArtifactId);
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.fetchStatusSuccess({
          ...basePayload,
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(
        gitArtifactActions.fetchStatusError({
          ...basePayload,
          error,
        }),
      );
    } else {
      log.error(e);
      captureException(e);
    }

    // ! case: better error handling than passing strings
    // if ((error as Error)?.message?.includes("Auth fail")) {
    //   payload.error = new Error(createMessage(ERROR_GIT_AUTH_FAIL));
    // } else if ((error as Error)?.message?.includes("Invalid remote: origin")) {
    //   payload.error = new Error(createMessage(ERROR_GIT_INVALID_REMOTE));
    // }
  }
}
