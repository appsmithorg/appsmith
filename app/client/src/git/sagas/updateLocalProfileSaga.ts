import type { UpdateLocalProfileInitPayload } from "../store/actions/updateLocalProfileActions";
import updateLocalProfileRequest from "git/requests/updateLocalProfileRequest";
import type {
  UpdateLocalProfileRequestParams,
  UpdateLocalProfileResponse,
} from "git/requests/updateLocalProfileRequest.types";
import { gitArtifactActions } from "../store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "../store/types";
import { call, put } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import log from "loglevel";
import { captureException } from "@sentry/react";

export default function* updateLocalProfileSaga(
  action: GitArtifactPayloadAction<UpdateLocalProfileInitPayload>,
) {
  const { artifactType, baseArtifactId } = action.payload;
  const basePayload = { artifactType, baseArtifactId };
  let response: UpdateLocalProfileResponse | undefined;

  try {
    const params: UpdateLocalProfileRequestParams = {
      authorName: action.payload.authorName,
      authorEmail: action.payload.authorEmail,
      useGlobalProfile: action.payload.useGlobalProfile,
    };

    response = yield call(updateLocalProfileRequest, baseArtifactId, params);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(gitArtifactActions.updateLocalProfileSuccess(basePayload));
      yield put(gitArtifactActions.fetchLocalProfileInit(basePayload));
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(
        gitArtifactActions.updateLocalProfileError({ ...basePayload, error }),
      );
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
