import type { DeleteBranchInitPayload } from "../store/actions/deleteBranchActions";
import deleteBranchRequest from "../requests/deleteBranchRequest";
import type {
  DeleteBranchRequestParams,
  DeleteBranchResponse,
} from "../requests/deleteBranchRequest.types";
import { gitArtifactActions } from "../store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "../store/types";
import { call, put } from "redux-saga/effects";

// internal dependencies
import { validateResponse } from "sagas/ErrorSagas";
import log from "loglevel";
import { captureException } from "@sentry/react";

export default function* deleteBranchSaga(
  action: GitArtifactPayloadAction<DeleteBranchInitPayload>,
) {
  const { artifactDef, artifactId } = action.payload;
  let response: DeleteBranchResponse | undefined;

  try {
    const params: DeleteBranchRequestParams = {
      branchName: action.payload.branchName,
    };

    response = yield call(
      deleteBranchRequest,
      artifactDef.baseArtifactId,
      params,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(gitArtifactActions.deleteBranchSuccess({ artifactDef }));
      yield put(
        gitArtifactActions.fetchBranchesInit({
          artifactDef,
          artifactId,
          pruneBranches: true,
        }),
      );
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(gitArtifactActions.deleteBranchError({ artifactDef, error }));
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
