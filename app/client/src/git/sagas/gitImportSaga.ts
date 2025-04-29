import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import type { PayloadAction } from "@reduxjs/toolkit";
import gitImportRequest from "git/requests/gitImportRequest";
import type {
  GitImportRequestParams,
  GitImportResponse,
} from "git/requests/gitImportRequest.types";
import type { GitImportInitPayload } from "git/store/actions/gitImportActions";
import { gitGlobalActions } from "git/store/gitGlobalSlice";
import { getWorkspaceIdForImport } from "ee/selectors/applicationSelectors";
import { GitErrorCodes } from "git/constants/enums";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import handleApiErrors from "./helpers/handleApiErrors";
import type { GitApiError } from "git/store/types";

export default function* gitImportSaga(
  action: PayloadAction<GitImportInitPayload>,
) {
  const { ...params } = action.payload;
  const workspaceId: string = yield select(getWorkspaceIdForImport);

  let response: GitImportResponse | undefined;

  try {
    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      gitImportRequest,
      workspaceId,
      params,
      isGitApiContractsEnabled,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(
        gitGlobalActions.gitImportSuccess({ responseData: response.data }),
      );
      yield put(gitGlobalActions.toggleImportModal({ open: false }));
      yield put(gitGlobalActions.resetImportOverrideDetails());
    }
  } catch (e) {
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(gitGlobalActions.gitImportError({ error }));

      if (GitErrorCodes.REPO_LIMIT_REACHED === error.code) {
        yield put(gitGlobalActions.toggleImportModal({ open: false }));
        yield put(gitGlobalActions.toggleRepoLimitErrorModal({ open: true }));
      }

      if (GitErrorCodes.DUPLICATE_ARTIFACT_OVERRIDE === error.code) {
        yield call(handleDuplicateArtifactOverride, error, params);
      }
    }
  }
}

function* handleDuplicateArtifactOverride(
  error: GitApiError,
  params: GitImportRequestParams,
) {
  yield put(gitGlobalActions.toggleImportModal({ open: false }));

  let artifactNames = { newArtifactName: null, oldArtifactName: null };

  if (error?.message) {
    const jsonMatch = error.message.match(/\{.*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : null;

    if (jsonStr) {
      try {
        artifactNames = JSON.parse(jsonStr);
      } catch {}
    }
  }

  yield put(
    gitGlobalActions.setImportOverrideDetails({
      params,
      oldArtifactName: artifactNames.oldArtifactName ?? "",
      newArtifactName: artifactNames.newArtifactName ?? "",
    }),
  );
}
