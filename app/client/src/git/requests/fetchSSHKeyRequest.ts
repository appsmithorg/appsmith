import type { AxiosPromise } from "axios";
import type { FetchSSHKeyResponse } from "./fetchSSHKeyRequest.types";
import Api from "api/Api";
import { APPLICATION_BASE_URL, GIT_BASE_URL } from "./constants";
import type { GitArtifactType } from "git/constants/enums";

async function fetchSSHKeyRequestOld(
  baseArtifactId: string,
): AxiosPromise<FetchSSHKeyResponse> {
  return Api.get(`${APPLICATION_BASE_URL}/${baseArtifactId}/ssh-keypair/`);
}

async function fetchSSHKeyRequestNew(
  artifactType: GitArtifactType,
  baseArtifactId: string,
): AxiosPromise<FetchSSHKeyResponse> {
  return Api.get(
    `${GIT_BASE_URL}/${artifactType}/${baseArtifactId}/ssh-keypair`,
  );
}

export default async function fetchSSHKeyRequest(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  isNew: boolean,
): AxiosPromise<FetchSSHKeyResponse> {
  if (isNew) {
    return fetchSSHKeyRequestNew(artifactType, baseArtifactId);
  } else {
    return fetchSSHKeyRequestOld(baseArtifactId);
  }
}
