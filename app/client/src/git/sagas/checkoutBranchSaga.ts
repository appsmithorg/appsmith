import { call, put, select } from "redux-saga/effects";
import type { CheckoutBranchInitPayload } from "../store/actions/checkoutBranchActions";
import { GitArtifactType } from "../constants/enums";
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
import applicationRedirectToClosestEntitySaga from "git/artifact-helpers/application/applicationRedirectToClosestEntitySaga";
import packageRedirectToClosestEntitySaga from "git/artifact-helpers/package/packageRedirectToClosestEntitySaga";
import { GIT_BRANCH_QUERY_KEY } from "git/constants/misc";

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
      const trimmedBranch = branchName.replace(/^origin\//, "");
      const url = new URL(window.location.href);

      url.searchParams.set(GIT_BRANCH_QUERY_KEY, trimmedBranch);

      if (artifactDef.artifactType === GitArtifactType.Application) {
        yield applicationRedirectToClosestEntitySaga(url.href);
      } else if (artifactDef.artifactType === GitArtifactType.Package) {
        yield packageRedirectToClosestEntitySaga(url.href);
      }

      yield put(gitArtifactActions.checkoutBranchSuccess({ artifactDef }));
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
