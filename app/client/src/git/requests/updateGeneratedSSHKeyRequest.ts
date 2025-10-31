import type { AxiosPromise } from "axios";
import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import { GitArtifactType } from "git/constants/enums";
import type { UpdateGeneratedSSHKeyResponse } from "./updateGeneratedSSHKeyRequest.types";

const TYPE_MAPPING: Record<GitArtifactType, string> = {
  [GitArtifactType.Application]: "APPLICATION",
  [GitArtifactType.Package]: "PACKAGE",
  [GitArtifactType.Workflow]: "WORKFLOW",
};

export default async function updateGeneratedSSHKeyRequest(
  artifactType: GitArtifactType,
  baseArtifactId: string,
): AxiosPromise<UpdateGeneratedSSHKeyResponse> {
  return Api.post(
    `${GIT_BASE_URL}/artifacts/${baseArtifactId}/ssh-keypair?artifactType=${TYPE_MAPPING[artifactType]}`,
  );
}
