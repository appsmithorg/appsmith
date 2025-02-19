import type { AxiosPromise } from "axios";
import type {
  GenerateSSHKeyRequestParams,
  GenerateSSHKeyResponse,
} from "./generateSSHKeyRequest.types";
import { APPLICATION_BASE_URL, GIT_BASE_URL } from "./constants";
import Api from "api/Api";
import type { GitArtifactType } from "git/constants/enums";

async function generateSSHKeyRequestOld(
  baseArtifactId: string,
  params: GenerateSSHKeyRequestParams,
): AxiosPromise<GenerateSSHKeyResponse> {
  const url = `${APPLICATION_BASE_URL}/ssh-keypair/${baseArtifactId}?keyType=${params.keyType}`;

  return Api.post(url);
}

async function generateSSHKeyRequestNew(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  params: GenerateSSHKeyRequestParams,
): AxiosPromise<GenerateSSHKeyResponse> {
  return Api.post(
    `${GIT_BASE_URL}/${artifactType}/${baseArtifactId}/ssh-keypair?keyType=${params.keyType}`,
  );
}

export default async function generateSSHKeyRequest(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  params: GenerateSSHKeyRequestParams,
  isNew: boolean,
): AxiosPromise<GenerateSSHKeyResponse> {
  if (isNew) {
    return generateSSHKeyRequestNew(artifactType, baseArtifactId, params);
  } else {
    return generateSSHKeyRequestOld(baseArtifactId, params);
  }
}
