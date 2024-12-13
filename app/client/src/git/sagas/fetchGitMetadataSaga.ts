import { captureException } from "@sentry/react";
import fetchGitMetadataRequest from "git/requests/fetchGitMetadataRequest";
import type { FetchGitMetadataResponse } from "git/requests/fetchGitMetadataRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "git/store/types";
import log from "loglevel";
import { call, put } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";

export default function* fetchGitMetadataSaga(
  action: GitArtifactPayloadAction,
) {
  const { artifactType, baseArtifactId } = action.payload;
  const basePayload = { artifactType, baseArtifactId };
  let response: FetchGitMetadataResponse | undefined;

  try {
    response = yield call(fetchGitMetadataRequest, baseArtifactId);
    const isValidResponse: boolean = yield validateResponse(response, false);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.fetchGitMetadataSuccess({
          ...basePayload,
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(
        gitArtifactActions.fetchGitMetadataError({
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
