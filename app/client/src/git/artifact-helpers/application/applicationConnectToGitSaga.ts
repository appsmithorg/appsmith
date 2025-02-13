import { fetchPageAction } from "actions/pageActions";
import { addBranchParam } from "constants/routes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import type { ConnectResponse } from "git/requests/connectRequest.types";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitApplicationArtifact, GitArtifactDef } from "git/types";
import { put, select } from "redux-saga/effects";
import { getCurrentPageId } from "selectors/editorSelectors";
import history from "utils/history";

export default function* applicationConnectToGitSaga(
  artifactDef: GitArtifactDef,
  response: ConnectResponse,
) {
  const pageId: string = yield select(getCurrentPageId);

  yield put(fetchPageAction(pageId));

  const branch = response.data?.gitApplicationMetadata?.branchName;

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
      artifact: response.data,
    }),
  );
}
