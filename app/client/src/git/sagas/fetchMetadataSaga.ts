import { captureException } from "@sentry/react";
import fetchMetadataRequest from "git/requests/fetchMetadataRequest";
import type { FetchMetadataResponse } from "git/requests/fetchMetadataRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "git/store/types";
import log from "loglevel";
import { call, put } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";

export default function* fetchMetadataSaga(action: GitArtifactPayloadAction) {
  const { artifactType, baseArtifactId } = action.payload;
  const basePayload = { artifactType, baseArtifactId };
  let response: FetchMetadataResponse | undefined;

  try {
    response = yield call(fetchMetadataRequest, baseArtifactId);
    const isValidResponse: boolean = yield validateResponse(response, false);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.fetchMetadataSuccess({
          ...basePayload,
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(
        gitArtifactActions.fetchMetadataError({
          ...basePayload,
          error,
        }),
      );
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
