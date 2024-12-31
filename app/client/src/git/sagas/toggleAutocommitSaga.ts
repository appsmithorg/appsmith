import { captureException } from "@sentry/react";
import toggleAutocommitRequest from "git/requests/toggleAutocommitRequest";
import type { ToggleAutocommitResponse } from "git/requests/toggleAutocommitRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "git/store/types";
import log from "loglevel";
import { call, put } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";

export default function* toggleAutocommitSaga(
  action: GitArtifactPayloadAction,
) {
  const { artifactType, baseArtifactId } = action.payload;
  const artifactDef = { artifactType, baseArtifactId };
  let response: ToggleAutocommitResponse | undefined;

  try {
    response = yield call(toggleAutocommitRequest, baseArtifactId);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(gitArtifactActions.toggleAutocommitSuccess(artifactDef));
      yield put(gitArtifactActions.fetchMetadataInit(artifactDef));
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(
        gitArtifactActions.toggleAutocommitError({ ...artifactDef, error }),
      );
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
