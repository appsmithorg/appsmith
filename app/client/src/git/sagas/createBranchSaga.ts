import { call, put } from "redux-saga/effects";
import type { CreateBranchInitPayload } from "../store/actions/createBranchActions";
import createBranchRequest from "../requests/createBranchRequest";
import type {
  CreateBranchRequestParams,
  CreateBranchResponse,
} from "../requests/createBranchRequest.types";
import { gitArtifactActions } from "../store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "../store/types";

// internal dependencies
import { validateResponse } from "sagas/ErrorSagas";

export default function* createBranchSaga(
  action: GitArtifactPayloadAction<CreateBranchInitPayload>,
) {
  const { artifactType, baseArtifactId } = action.payload;
  const basePayload = { artifactType, baseArtifactId };
  let response: CreateBranchResponse | undefined;

  try {
    const params: CreateBranchRequestParams = {
      branchName: action.payload.branchName,
    };

    response = yield call(createBranchRequest, baseArtifactId, params);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(gitArtifactActions.createBranchSuccess(basePayload));
      yield put(
        gitArtifactActions.fetchBranchesInit({
          ...basePayload,
          pruneBranches: true,
        }),
      );

      // ! case to switch to the new branch
    }
  } catch (error) {
    yield put(
      gitArtifactActions.createBranchError({
        ...basePayload,
        error: error as string,
      }),
    );
  }
}
