import { captureException } from "@sentry/react";
import fetchGlobalSSHKeyRequest from "git/requests/fetchGlobalSSHKeyRequest";
import type {
  GenerateSSHKeyRequestParams,
  GenerateSSHKeyResponse,
} from "git/requests/generateSSHKeyRequest.types";
import type { FetchGlobalSSHKeyInitPayload } from "git/store/actions/fetchGlobalSSHKeyActions";
import { gitGlobalActions } from "git/store/gitGlobalSlice";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import type { GitArtifactPayloadAction } from "git/store/types";
import log from "loglevel";
import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";

export function* fetchGlobalSSHKeySaga(
  action: GitArtifactPayloadAction<FetchGlobalSSHKeyInitPayload>,
) {
  let response: GenerateSSHKeyResponse | undefined;

  try {
    const params: GenerateSSHKeyRequestParams = {
      keyType: action.payload.keyType,
    };

    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      fetchGlobalSSHKeyRequest,
      params,
      isGitApiContractsEnabled,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(
        gitGlobalActions.fetchGlobalSSHKeySuccess({
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(gitGlobalActions.fetchGlobalSSHKeyError({ error }));
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
