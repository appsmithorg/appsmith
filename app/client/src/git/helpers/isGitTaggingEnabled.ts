import { GitArtifactType } from "git/constants/enums";
import type { GitArtifactDef } from "git/types";

function isGitTaggingEnabled(artifactDef: GitArtifactDef | null) {
  if (artifactDef?.artifactType === GitArtifactType.Package) {
    return true;
  }

  return false;
}

export default isGitTaggingEnabled;
