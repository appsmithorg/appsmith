import { captureException } from "@sentry/react";
import { GitErrorCodes } from "git/constants/enums";
import generateSSHKeyRequest from "git/requests/generateSSHKeyRequest";
import type {
  GenerateSSHKeyRequestParams,
  GenerateSSHKeyResponse,
} from "git/requests/generateSSHKeyRequest.types";
import type { GenerateSSHKeyInitPayload } from "git/store/actions/generateSSHKeyActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "git/store/types";
import log from "loglevel";
import { call, put } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";

export function* generateSSHKeySaga(
  action: GitArtifactPayloadAction<GenerateSSHKeyInitPayload>,
) {
  const { artifactType, baseArtifactId } = action.payload;
  const artifactDef = { artifactType, baseArtifactId };
  let response: GenerateSSHKeyResponse | undefined;

  try {
    const params: GenerateSSHKeyRequestParams = {
      keyType: action.payload.keyType,
      isImport: action.payload.isImport,
    };

    response = yield call(generateSSHKeyRequest, baseArtifactId, params);
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.generateSSHKeySuccess({
          ...artifactDef,
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      if (GitErrorCodes.REPO_LIMIT_REACHED === error.code) {
        yield put(
          gitArtifactActions.toggleRepoLimitErrorModal({
            ...artifactDef,
            open: true,
          }),
        );
      }

      yield put(
        gitArtifactActions.generateSSHKeyError({ ...artifactDef, error }),
      );
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
