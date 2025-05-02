import { GitArtifactType } from "git/constants/enums";
import type { GitArtifactDef } from "git/types";

function isProtectedBranchesEnabled(artifactDef: GitArtifactDef) {
  if (artifactDef.artifactType === GitArtifactType.Application) {
    return true;
  }

  return false;
}

export default isProtectedBranchesEnabled;
