import { call, put, select } from "redux-saga/effects";
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
import { gitGlobalActions } from "git/store/gitGlobalSlice";
import type { ApplicationPayload } from "entities/Application";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

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
        const currentApplication: ApplicationPayload = yield select(
          getCurrentApplication,
        );

        if (currentApplication) {
          currentApplication.lastDeployedAt = new Date().toISOString();
          yield put({
            type: ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
            payload: currentApplication,
          });
        }
      }
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      if (error.code === GitErrorCodes.REPO_LIMIT_REACHED) {
        yield put(
          gitGlobalActions.toggleRepoLimitErrorModal({
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
