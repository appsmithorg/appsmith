import { GitArtifactType } from "git/constants/enums";
import type { InitGitForEditorPayload } from "git/store/actions/initGitActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "git/store/types";
import { put, take } from "redux-saga/effects";

export default function* initGitForEditorSaga(
  action: GitArtifactPayloadAction<InitGitForEditorPayload>,
) {
  const { artifact, artifactDef } = action.payload;
  const artifactId = artifact?.id;

  yield put(gitArtifactActions.mount({ artifactDef }));

  if (artifactId && artifactDef.artifactType === GitArtifactType.Application) {
    if (!!artifact?.gitApplicationMetadata?.remoteUrl) {
      yield put(gitArtifactActions.fetchMetadataInit({ artifactDef }));
      yield take(gitArtifactActions.fetchMetadataSuccess.type);
      yield put(
        gitArtifactActions.triggerAutocommitInit({ artifactDef, artifactId }),
      );
      yield put(
        gitArtifactActions.fetchBranchesInit({ artifactDef, artifactId }),
      );
      yield put(gitArtifactActions.fetchProtectedBranchesInit({ artifactDef }));
      yield put(
        gitArtifactActions.fetchStatusInit({ artifactDef, artifactId }),
      );
    }
  }
}
