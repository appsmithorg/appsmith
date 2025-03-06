import { GitErrorCodes } from "git/constants/enums";
import generateSSHKeyRequest from "git/requests/generateSSHKeyRequest";
import type {
  GenerateSSHKeyRequestParams,
  GenerateSSHKeyResponse,
} from "git/requests/generateSSHKeyRequest.types";
import type { GenerateSSHKeyInitPayload } from "git/store/actions/generateSSHKeyActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { gitGlobalActions } from "git/store/gitGlobalSlice";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import type { GitArtifactPayloadAction } from "git/store/types";
import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import handleApiErrors from "./helpers/handleApiErrors";

export function* generateSSHKeySaga(
  action: GitArtifactPayloadAction<GenerateSSHKeyInitPayload>,
) {
  const { artifactDef } = action.payload;
  let response: GenerateSSHKeyResponse | undefined;

  try {
    const params: GenerateSSHKeyRequestParams = {
      keyType: action.payload.keyType,
    };

    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      generateSSHKeyRequest,
      artifactDef.artifactType,
      artifactDef.baseArtifactId,
      params,
      isGitApiContractsEnabled,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.generateSSHKeySuccess({
          artifactDef,
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(gitArtifactActions.generateSSHKeyError({ artifactDef, error }));

      if (error.code == GitErrorCodes.REPO_LIMIT_REACHED) {
        yield put(gitGlobalActions.toggleRepoLimitErrorModal({ open: true }));
      }
    }
  }
}
