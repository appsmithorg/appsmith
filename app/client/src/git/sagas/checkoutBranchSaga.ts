import { call, put, select } from "redux-saga/effects";
import type { CheckoutBranchInitPayload } from "../store/actions/checkoutBranchActions";
import { gitArtifactActions } from "../store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "../store/types";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import type {
  CheckoutRefRequestParams,
  CheckoutRefResponse,
} from "git/requests/checkoutRefRequest.types";
import { validateResponse } from "sagas/ErrorSagas";
import checkoutRefRequest from "git/requests/checkoutRefRequest";
import handleApiErrors from "./helpers/handleApiErrors";

export default function* checkoutBranchSaga(
  action: GitArtifactPayloadAction<CheckoutBranchInitPayload>,
) {
  const { artifactDef, artifactId, branchName } = action.payload;
  let response: CheckoutRefResponse | undefined;

  try {
    const params: CheckoutRefRequestParams = {
      refType: "branch",
      refName: branchName,
    };
    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      checkoutRefRequest,
      artifactDef.artifactType,
      artifactId,
      params,
      isGitApiContractsEnabled,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.checkoutBranchSuccess({
          artifactDef,
          responseData: response.data,
        }),
      );
      yield put(
        gitArtifactActions.toggleBranchPopup({ artifactDef, open: false }),
      );
    }
  } catch (e) {
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(gitArtifactActions.checkoutBranchError({ artifactDef, error }));
    }
  }
}
