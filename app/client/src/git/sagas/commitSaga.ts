import { captureException } from "@sentry/react";
import type { CommitInitPayload } from "../actions/commitActions";
import { GitArtifactType, GitErrorCodes } from "../constants/enums";
import commitRequest from "../requests/commitRequest";
import type { CommitResponse } from "../requests/commitRequest.types";
import { gitArtifactActions } from "../store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "../types";
import { call, put } from "redux-saga/effects";

// internal dependencies
import { validateResponse } from "sagas/ErrorSagas";

export default function* commitSaga(
  action: GitArtifactPayloadAction<CommitInitPayload>,
) {
  const { artifactType, baseArtifactId } = action.payload;
  const basePayload = { artifactType, baseArtifactId };
  let response: CommitResponse | undefined;

  try {
    const params = {
      commitMessage: action.payload.commitMessage,
      doPush: action.payload.doPush,
    };

    response = yield call(commitRequest, baseArtifactId, params);

    const isValidResponse: boolean = yield validateResponse(response, false);

    if (isValidResponse) {
      yield put(gitArtifactActions.commitSuccess(basePayload));
      yield put(
        gitArtifactActions.fetchStatusInit({
          ...basePayload,
          compareRemote: true,
        }),
      );

      if (artifactType === GitArtifactType.Application) {
        // ! case for updating lastDeployedAt in application manually?
      }
    }
  } catch (error) {
    if (
      GitErrorCodes.REPO_LIMIT_REACHED === response?.responseMeta?.error?.code
    ) {
      yield put(
        gitArtifactActions.toggleRepoLimitErrorModal({
          ...basePayload,
          open: true,
        }),
      );
    }

    if (response?.responseMeta?.error?.message) {
      yield put(
        gitArtifactActions.connectError({
          ...basePayload,
          error: response.responseMeta.error.message,
        }),
      );
    } else {
      captureException(error);
    }
  }
}
