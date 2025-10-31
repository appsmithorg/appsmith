import type { PayloadAction } from "@reduxjs/toolkit";
import type { UpdateGeneratedSSHKeyResponse } from "git/requests/updateGeneratedSSHKeyRequest.types";
import type { GitArtifactBasePayload } from "git/store/types";
import { gitGlobalActions } from "git/store/gitGlobalSlice";
import { call, put } from "redux-saga/effects";
import handleApiErrors from "./helpers/handleApiErrors";
import updateGeneratedSSHKeyRequest from "git/requests/updateGeneratedSSHKeyRequest";
import { validateResponse } from "sagas/ErrorSagas";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import AppsmithConsole from "utils/AppsmithConsole";

export function* updateGeneratedSSHKeySaga(
  action: PayloadAction<GitArtifactBasePayload>,
) {
  const { artifactDef } = action.payload;
  let response: UpdateGeneratedSSHKeyResponse | undefined;

  try {
    response = yield call(
      updateGeneratedSSHKeyRequest,
      artifactDef.artifactType,
      artifactDef.baseArtifactId,
    );
    const isValidResponse: boolean = yield validateResponse(response, false);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.initGitForEditor({
          artifactDef,
          artifact: response.data,
        }),
      );
      yield put(gitGlobalActions.updateGeneratedSSHKeySuccess());
      AppsmithConsole.deleteErrors([
        { id: `invalid-deploy-key-${artifactDef.baseArtifactId}` },
      ]);
      yield put(gitGlobalActions.toggleGenerateSSHKeyModal({ open: false }));
    }
  } catch (e) {
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(gitGlobalActions.updateGeneratedSSHKeyError({ error }));
    }
  }
}
