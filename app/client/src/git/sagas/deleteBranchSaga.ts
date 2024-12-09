import type { DeleteBranchInitPayload } from "../actions/deleteBranchActions";
import deleteBranchRequest from "../requests/deleteBranchRequest";
import type {
  DeleteBranchRequestParams,
  DeleteBranchResponse,
} from "../requests/deleteBranchRequest.types";
import { gitArtifactActions } from "../store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "../types";
import { call, put } from "redux-saga/effects";

// internal dependencies
import { validateResponse } from "sagas/ErrorSagas";

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
  } catch (error) {
    yield put(
      gitArtifactActions.deleteBranchError({
        ...basePayload,
        error: error as string,
      }),
    );
  }
}
