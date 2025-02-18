import type { FetchBranchesInitPayload } from "../store/actions/fetchBranchesActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "../store/types";
import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import fetchRefsRequest from "git/requests/fetchRefsRequest";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import type {
  FetchRefsRequestParams,
  FetchRefsResponse,
} from "git/requests/fetchRefsRequest.types";
import handleApiErrors from "./helpers/handleApiErrors";

export default function* fetchBranchesSaga(
  action: GitArtifactPayloadAction<FetchBranchesInitPayload>,
) {
  const { artifactDef, artifactId } = action.payload;
  let response: FetchRefsResponse | undefined;

  try {
    const params: FetchRefsRequestParams = {
      refType: "branch",
      pruneRefs: action.payload.pruneBranches ?? true,
    };

    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      fetchRefsRequest,
      artifactDef.artifactType,
      artifactId,
      params,
      isGitApiContractsEnabled,
    );
    const isValidResponse: boolean = yield validateResponse(response, false);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.fetchBranchesSuccess({
          artifactDef,
          responseData: response.data,
        }),
      );
    }
  } catch (e) {
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(gitArtifactActions.fetchBranchesError({ artifactDef, error }));
    }
  }
}
