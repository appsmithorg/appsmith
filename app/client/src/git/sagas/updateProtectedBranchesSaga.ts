import { toast } from "@appsmith/ads";
import { createMessage, PROTECT_BRANCH_SUCCESS } from "ee/constants/messages";
import updateProtectedBranchesRequest from "git/requests/updateProtectedBranchesRequest";
import type {
  UpdateProtectedBranchesRequestParams,
  UpdateProtectedBranchesResponse,
} from "git/requests/updateProtectedBranchesRequest.types";
import type { UpdateProtectedBranchesInitPayload } from "git/store/actions/updateProtectedBranchesActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import type { GitArtifactPayloadAction } from "git/store/types";
import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import handleApiErrors from "./helpers/handleApiErrors";

export default function* updateProtectedBranchesSaga(
  action: GitArtifactPayloadAction<UpdateProtectedBranchesInitPayload>,
) {
  const { artifactDef } = action.payload;
  let response: UpdateProtectedBranchesResponse | undefined;

  try {
    const params: UpdateProtectedBranchesRequestParams = {
      branchNames: action.payload.branchNames,
    };

    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      updateProtectedBranchesRequest,
      artifactDef.artifactType,
      artifactDef.baseArtifactId,
      params,
      isGitApiContractsEnabled,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.updateProtectedBranchesSuccess({ artifactDef }),
      );
      yield put(gitArtifactActions.fetchProtectedBranchesInit({ artifactDef }));

      toast.show(createMessage(PROTECT_BRANCH_SUCCESS), {
        kind: "success",
      });
    }
  } catch (e) {
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(
        gitArtifactActions.updateProtectedBranchesError({ artifactDef, error }),
      );
    }
  }
}
