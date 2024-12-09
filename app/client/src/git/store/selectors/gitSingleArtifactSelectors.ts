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
