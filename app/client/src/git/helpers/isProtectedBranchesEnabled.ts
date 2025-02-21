import { GitArtifactType } from "git/constants/enums";
import type { GitArtifactDef } from "git/types";

// ? Temporary, will be removed when the feature is supported in packages
function isProtectedBranchesEnabled(artifactDef: GitArtifactDef) {
  if (artifactDef.artifactType === GitArtifactType.Application) {
    return true;
  }

  return false;
}

export default isProtectedBranchesEnabled;
