import type { AxiosPromise } from "axios";
import { GIT_BASE_URL } from "./constants";
import type { DisconnectResponse } from "./disconnectRequest.types";
import Api from "api/Api";
import type { GitArtifactType } from "git/constants/enums";

async function disconnectRequestOld(
  baseApplicationId: string,
): AxiosPromise<DisconnectResponse> {
  return Api.post(`${GIT_BASE_URL}/disconnect/app/${baseApplicationId}`);
}

async function disconnectRequestNew(
  artifactType: GitArtifactType,
  baseArtifactId: string,
): AxiosPromise<DisconnectResponse> {
  return Api.post(
    `${GIT_BASE_URL}/${artifactType}/${baseArtifactId}/disconnect`,
  );
}

export default async function disconnectRequest(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  isNew: boolean,
) {
  if (isNew) {
    return disconnectRequestNew(artifactType, baseArtifactId);
  } else {
    return disconnectRequestOld(baseArtifactId);
  }
}
