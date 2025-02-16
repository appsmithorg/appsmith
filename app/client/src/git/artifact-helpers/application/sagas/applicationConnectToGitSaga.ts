import { fetchPageAction } from "actions/pageActions";
import { addBranchParam } from "constants/routes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { GitArtifactType } from "git/constants/enums";
import type { ConnectSuccessPayload } from "git/store/actions/connectActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "git/store/types";
import type { GitApplicationArtifact } from "git/types";
import { put, select } from "redux-saga/effects";
import { getCurrentPageId } from "selectors/editorSelectors";
import history from "utils/history";

export default function* applicationConnectToGitSaga(
  action: GitArtifactPayloadAction<ConnectSuccessPayload>,
) {
  const { artifactDef, responseData: destArtifact } = action.payload;

  if (artifactDef.artifactType !== GitArtifactType.Application) return;

  const pageId: string = yield select(getCurrentPageId);

  yield put(fetchPageAction(pageId));

  const branch = destArtifact?.gitApplicationMetadata?.branchName;

  if (branch) {
    const newUrl = addBranchParam(branch);

    history.replace(newUrl);
  }

  const currentApplication: GitApplicationArtifact = yield select(
    getCurrentApplication,
  );

  if (currentApplication) {
    currentApplication.lastDeployedAt = new Date().toISOString();
    yield put({
      type: ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
      payload: currentApplication,
    });
  }

  yield put(
    gitArtifactActions.initGitForEditor({
      artifactDef,
      artifact: destArtifact,
    }),
  );
}
