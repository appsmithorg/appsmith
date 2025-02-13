import { GitArtifactType } from "git/constants/enums";
import isAutocommitEnabled from "git/helpers/isAutocommitEnabled";
import isProtectedBranchesEnabled from "git/helpers/isProtectedBranchesEnabled";
import { updateBranchParam } from "git/helpers/updateBranchParam";
import type { InitGitForEditorPayload } from "git/store/actions/initGitActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import type { GitArtifactPayloadAction } from "git/store/types";
import type { GitApplicationArtifact, GitPackageArtifact } from "git/types";
import { put, take } from "redux-saga/effects";

export default function* initGitForEditorSaga(
  action: GitArtifactPayloadAction<InitGitForEditorPayload>,
) {
  const { artifact, artifactDef } = action.payload;
  const artifactId = artifact?.id;

  yield put(gitArtifactActions.mount({ artifactDef }));

  if (artifactId) {
    let branchName;

    if (artifactDef.artifactType === GitArtifactType.Application) {
      branchName = (artifact as GitApplicationArtifact)?.gitApplicationMetadata
        ?.branchName;
    } else if (artifactDef.artifactType === GitArtifactType.Package) {
      branchName = (artifact as GitPackageArtifact)?.gitArtifactMetadata
        ?.branchName;
    }

    if (!!branchName) {
      updateBranchParam(branchName);

      yield put(gitArtifactActions.fetchMetadataInit({ artifactDef }));
      yield take(gitArtifactActions.fetchMetadataSuccess.type);

      if (isAutocommitEnabled(artifactDef)) {
        yield put(
          gitArtifactActions.triggerAutocommitInit({ artifactDef, artifactId }),
        );
      }

      yield put(
        gitArtifactActions.fetchBranchesInit({ artifactDef, artifactId }),
      );

      if (isProtectedBranchesEnabled(artifactDef)) {
        yield put(
          gitArtifactActions.fetchProtectedBranchesInit({ artifactDef }),
        );
      }

      yield put(
        gitArtifactActions.fetchStatusInit({ artifactDef, artifactId }),
      );
    }
  }

  yield put(gitArtifactActions.initGitForEditorSuccess({ artifactDef }));
}
