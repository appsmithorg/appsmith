import { GitArtifactType } from "git/constants/enums";
import type { GitArtifactDef } from "git/types";

export default function packageArtifact(basePackageId: string): GitArtifactDef {
  return {
    artifactType: GitArtifactType.Package,
    baseArtifactId: basePackageId,
  };
}
