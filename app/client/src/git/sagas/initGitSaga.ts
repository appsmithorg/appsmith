import { GitArtifactType } from "git/constants/enums";
import type { InitGitForEditorPayload } from "git/store/actions/initGitActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "git/store/types";
import { put, take } from "redux-saga/effects";

export default function* initGitForEditorSaga(
  action: GitArtifactPayloadAction<InitGitForEditorPayload>,
) {
  const { artifact, artifactType, baseArtifactId } = action.payload;
  const basePayload = { artifactType, baseArtifactId };

  yield put(gitArtifactActions.mount(basePayload));

  if (artifactType === GitArtifactType.Application) {
    if (!!artifact.gitApplicationMetadata?.remoteUrl) {
      yield put(gitArtifactActions.fetchMetadataInit(basePayload));
      yield take(gitArtifactActions.fetchMetadataSuccess.type);
      yield put(
        gitArtifactActions.triggerAutocommitInit({
          ...basePayload,
          artifactId: artifact.id,
        }),
      );
      yield put(gitArtifactActions.fetchBranchesInit(basePayload));
      yield put(gitArtifactActions.fetchProtectedBranchesInit(basePayload));
      yield put(gitArtifactActions.fetchStatusInit(basePayload));
    }
  }
}
