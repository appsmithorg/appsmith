import type { UpdateLocalProfileInitPayload } from "../store/actions/updateLocalProfileActions";
import updateLocalProfileRequest from "git/requests/updateLocalProfileRequest";
import type {
  UpdateLocalProfileRequestParams,
  UpdateLocalProfileResponse,
} from "git/requests/updateLocalProfileRequest.types";
import { gitArtifactActions } from "../store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "../store/types";
import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import log from "loglevel";
import { captureException } from "@sentry/react";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";

export default function* updateLocalProfileSaga(
  action: GitArtifactPayloadAction<UpdateLocalProfileInitPayload>,
) {
  const { artifactDef } = action.payload;
  let response: UpdateLocalProfileResponse | undefined;

  try {
    const params: UpdateLocalProfileRequestParams = {
      authorName: action.payload.authorName,
      authorEmail: action.payload.authorEmail,
      useGlobalProfile: action.payload.useGlobalProfile,
    };

    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      updateLocalProfileRequest,
      artifactDef.artifactType,
      artifactDef.baseArtifactId,
      params,
      isGitApiContractsEnabled,
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(gitArtifactActions.updateLocalProfileSuccess({ artifactDef }));
      yield put(gitArtifactActions.fetchLocalProfileInit({ artifactDef }));
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(
        gitArtifactActions.updateLocalProfileError({ artifactDef, error }),
      );
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
