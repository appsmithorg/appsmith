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
import { captureException } from "instrumentation";

export default function* deleteBranchSaga(
  action: GitArtifactPayloadAction<DeleteBranchInitPayload>,
) {
  const { artifactType, baseArtifactId } = action.payload;
  const basePayload = { artifactType, baseArtifactId };
  let response: DeleteBranchResponse | undefined;

  try {
    const params: DeleteBranchRequestParams = {
      branchName: action.payload.branchName,
    };

    response = yield call(deleteBranchRequest, baseArtifactId, params);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(gitArtifactActions.deleteBranchSuccess(basePayload));
      yield put(
        gitArtifactActions.fetchBranchesInit({
          ...basePayload,
          pruneBranches: true,
        }),
      );
    }
  } catch (e) {
    if (response && response.responseMeta.error) {
      const { error } = response.responseMeta;

      yield put(
        gitArtifactActions.deleteBranchError({
          ...basePayload,
          error,
        }),
      );
    } else {
      log.error(e);
      captureException(e);
    }
  }
}
