import { GitArtifactType } from "git/constants/enums";
import type { GitArtifactDef } from "git/store/selectors/gitSingleArtifactSelectors";

export default function applicationArtifact(
  baseApplicationId: string,
): GitArtifactDef {
  return {
    artifactType: GitArtifactType.Application,
    baseArtifactId: baseApplicationId,
  };
}
