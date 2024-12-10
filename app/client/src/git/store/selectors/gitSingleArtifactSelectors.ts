import type { GitArtifactType } from "git/constants/enums";
import type { GitRootState } from "../types";

interface GitArtifactDef {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
}

export const selectSingleArtifact = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => {
  return state.git.artifacts[artifactDef.artifactType]?.[
    artifactDef.baseArtifactId
  ];
};

// init
export const selectGitMetadata = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectSingleArtifact(state, artifactDef)?.apiResponses.metadata;

// git ops
export const selectCommit = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectSingleArtifact(state, artifactDef)?.apiResponses?.commit;

export const selectDiscard = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectSingleArtifact(state, artifactDef)?.apiResponses?.discard;

export const selectStatus = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectSingleArtifact(state, artifactDef)?.apiResponses?.status;

export const selectMerge = (state: GitRootState, artifactDef: GitArtifactDef) =>
  selectSingleArtifact(state, artifactDef)?.apiResponses?.merge;

export const selectMergeStatus = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectSingleArtifact(state, artifactDef)?.apiResponses?.mergeStatus;

export const selectPull = (state: GitRootState, artifactDef: GitArtifactDef) =>
  selectSingleArtifact(state, artifactDef)?.apiResponses?.pull;

// git branches
export const selectBranches = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectSingleArtifact(state, artifactDef)?.apiResponses?.branches;

export const selectCreateBranch = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectSingleArtifact(state, artifactDef)?.apiResponses?.createBranch;

export const selectDeleteBranch = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectSingleArtifact(state, artifactDef)?.apiResponses?.deleteBranch;

export const selectCheckoutBranch = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) => selectSingleArtifact(state, artifactDef)?.apiResponses.checkoutBranch;

// autocommit
export const selectAutocommitEnabled = (
  state: GitRootState,
  artifactDef: GitArtifactDef,
) =>
  selectSingleArtifact(state, artifactDef)?.apiResponses?.metadata?.value
    ?.autoCommitConfig?.enabled;
