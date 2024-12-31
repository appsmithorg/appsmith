import { call, put } from "redux-saga/effects";
import { captureException } from "@sentry/react";
import log from "loglevel";
import type { CommitInitPayload } from "../store/actions/commitActions";
import { GitArtifactType, GitErrorCodes } from "../constants/enums";
import commitRequest from "../requests/commitRequest";
import type {
  CommitRequestParams,
  CommitResponse,
} from "../requests/commitRequest.types";
import { gitArtifactActions } from "../store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "../store/types";

// internal dependencies
import { validateResponse } from "sagas/ErrorSagas";

export default function* commitSaga(
  action: GitArtifactPayloadAction<CommitInitPayload>,
) {
  const { artifactDef, artifactId } = action.payload;

  let response: CommitResponse | undefined;

  try {
    const params: CommitRequestParams = {
      commitMessage: action.payload.commitMessage,
      doPush: action.payload.doPush,
    };

    response = yield call(commitRequest, artifactId, params);

    const isValidResponse: boolean = yield validateResponse(response, false);

    if (isValidResponse) {
      yield put(gitArtifactActions.commitSuccess({ artifactDef }));
      yield put(
        gitArtifactActions.fetchStatusInit({
          artifactDef,
          artifactId,
          compareRemote: true,
        }),
      );

      if (artifactDef.artifactType === GitArtifactType.Application) {
        // ! case for updating lastDeployedAt in application manually?
      }
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      if (error.code === GitErrorCodes.REPO_LIMIT_REACHED) {
        yield put(
          gitArtifactActions.toggleRepoLimitErrorModal({
            artifactDef,
            open: true,
          }),
        );
      }

      yield put(gitArtifactActions.commitError({ artifactDef, error }));
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
