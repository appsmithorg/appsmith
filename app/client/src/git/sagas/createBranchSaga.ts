import { call, put, select } from "redux-saga/effects";
import type { CreateBranchInitPayload } from "../store/actions/createBranchActions";
import { gitArtifactActions } from "../store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "../store/types";

// internal dependencies
import { validateResponse } from "sagas/ErrorSagas";
import createRefRequest from "git/requests/createRefRequest";
import type {
  CreateRefRequestParams,
  CreateRefResponse,
} from "git/requests/createRefRequest.types";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import handleApiErrors from "./helpers/handleApiErrors";

export default function* createBranchSaga(
  action: GitArtifactPayloadAction<CreateBranchInitPayload>,
) {
  const { artifactDef, artifactId } = action.payload;
  let response: CreateRefResponse | undefined;

  try {
    const params: CreateRefRequestParams = {
      refType: "branch",
      refName: action.payload.branchName,
    };

    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      createRefRequest,
      artifactDef.artifactType,
      artifactId,
      params,
      isGitApiContractsEnabled,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(
        gitArtifactActions.fetchBranchesInit({
          artifactDef,
          artifactId,
          pruneBranches: true,
        }),
      );
      yield put(
        gitArtifactActions.checkoutBranchInit({
          artifactDef,
          artifactId,
          branchName: action.payload.branchName,
        }),
      );
      yield put(gitArtifactActions.createBranchSuccess({ artifactDef }));
      yield put(
        gitArtifactActions.toggleBranchPopup({
          artifactDef,
          open: false,
        }),
      );
    }
  } catch (e) {
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(gitArtifactActions.createBranchError({ artifactDef, error }));
    }
  }
}
