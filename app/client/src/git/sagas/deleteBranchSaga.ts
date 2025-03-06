import type { DeleteBranchInitPayload } from "../store/actions/deleteBranchActions";
import { gitArtifactActions } from "../store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "../store/types";
import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import { toast } from "@appsmith/ads";
import { createMessage, DELETE_BRANCH_SUCCESS } from "ee/constants/messages";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import deleteRefRequest from "git/requests/deleteRefRequest";
import type {
  DeleteRefRequestParams,
  DeleteRefResponse,
} from "git/requests/deleteRefRequest.types";
import handleApiErrors from "./helpers/handleApiErrors";

export default function* deleteBranchSaga(
  action: GitArtifactPayloadAction<DeleteBranchInitPayload>,
) {
  const { artifactDef, artifactId } = action.payload;
  let response: DeleteRefResponse | undefined;

  try {
    const params: DeleteRefRequestParams = {
      refType: "branch",
      refName: action.payload.branchName,
    };

    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      deleteRefRequest,
      artifactDef.artifactType,
      artifactDef.baseArtifactId,
      params,
      isGitApiContractsEnabled,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      toast.show(
        createMessage(DELETE_BRANCH_SUCCESS, action.payload.branchName),
        {
          kind: "success",
        },
      );
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
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(gitArtifactActions.deleteBranchError({ artifactDef, error }));
    }
  }
}
