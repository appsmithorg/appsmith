import { captureException } from "@sentry/react";
import updateProtectedBranchesRequest from "git/requests/updateProtectedBranchesRequest";
import type {
  UpdateProtectedBranchesRequestParams,
  UpdateProtectedBranchesResponse,
} from "git/requests/updateProtectedBranchesRequest.types";
import type { UpdateProtectedBranchesInitPayload } from "git/store/actions/updateProtectedBranchesActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "git/store/types";
import log from "loglevel";
import { call, put } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";

export default function* updateProtectedBranchesSaga(
  action: GitArtifactPayloadAction<UpdateProtectedBranchesInitPayload>,
) {
  const { artifactDef } = action.payload;
  let response: UpdateProtectedBranchesResponse | undefined;

  try {
    const params: UpdateProtectedBranchesRequestParams = {
      branchNames: action.payload.branchNames,
    };

    response = yield call(
      updateProtectedBranchesRequest,
      artifactDef.baseArtifactId,
      params,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.updateProtectedBranchesSuccess({ artifactDef }),
      );
      yield put(gitArtifactActions.fetchProtectedBranchesInit({ artifactDef }));
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(
        gitArtifactActions.updateProtectedBranchesError({
          artifactDef,
          error,
        }),
      );
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
