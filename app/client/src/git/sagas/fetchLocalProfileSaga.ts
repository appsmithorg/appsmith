import fetchLocalProfileRequest from "git/requests/fetchLocalProfileRequest";
import type { FetchLocalProfileResponse } from "git/requests/fetchLocalProfileRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "../store/types";
import { call, put } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import log from "loglevel";
import { captureException } from "@sentry/react";

export default function* fetchLocalProfileSaga(
  action: GitArtifactPayloadAction,
) {
  const { artifactDef } = action.payload;
  let response: FetchLocalProfileResponse | undefined;

  try {
    response = yield call(fetchLocalProfileRequest, artifactDef.baseArtifactId);
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.fetchLocalProfileSuccess({
          artifactDef,
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(
        gitArtifactActions.fetchLocalProfileError({ artifactDef, error }),
      );
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
