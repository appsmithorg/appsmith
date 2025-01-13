import { GitArtifactType } from "git/constants/enums";

export default function urlArtifactType(artifactType: GitArtifactType): string {
  switch (artifactType) {
    case GitArtifactType.Application:
      return "applications";
    case GitArtifactType.Package:
      return "packages";
    case GitArtifactType.Workflow:
      return "workflows";
  }
}
