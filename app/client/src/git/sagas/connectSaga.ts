import { gitArtifactActions } from "../store/gitArtifactSlice";
import connectRequest from "../requests/connectRequest";
import type {
  ConnectRequestParams,
  ConnectResponse,
} from "../requests/connectRequest.types";
import { GitErrorCodes } from "../constants/enums";
import type { GitArtifactPayloadAction } from "../store/types";
import type { ConnectInitPayload } from "../store/actions/connectActions";
import { call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import { gitGlobalActions } from "git/store/gitGlobalSlice";
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";
import handleApiErrors from "./helpers/handleApiErrors";

export default function* connectSaga(
  action: GitArtifactPayloadAction<ConnectInitPayload>,
) {
  const { artifactDef } = action.payload;

  let response: ConnectResponse | undefined;

  try {
    const params: ConnectRequestParams = {
      remoteUrl: action.payload.remoteUrl,
      gitProfile: action.payload.gitProfile,
    };

    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    response = yield call(
      connectRequest,
      artifactDef.artifactType,
      artifactDef.baseArtifactId,
      params,
      isGitApiContractsEnabled,
    );

    const isValidResponse: boolean = yield validateResponse(response, false);

    if (response && isValidResponse) {
      yield put(
        gitArtifactActions.connectSuccess({
          artifactDef,
          responseData: response.data,
        }),
      );
      yield put(
        gitArtifactActions.toggleConnectModal({ artifactDef, open: false }),
      );
      yield put(
        gitArtifactActions.toggleConnectSuccessModal({
          artifactDef,
          open: true,
        }),
      );
    }
  } catch (e) {
    const error = handleApiErrors(e as Error, response);

    if (error) {
      yield put(gitArtifactActions.connectError({ artifactDef, error }));

      if (error.code === GitErrorCodes.REPO_LIMIT_REACHED) {
        yield put(gitGlobalActions.toggleRepoLimitErrorModal({ open: true }));
      }
    }
  }
}
