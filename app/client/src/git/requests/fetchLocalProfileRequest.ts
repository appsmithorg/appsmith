import Api from "api/Api";
import type { AxiosPromise } from "axios";
import { GIT_BASE_URL } from "./constants";
import type { FetchLocalProfileResponse } from "./fetchLocalProfileRequest.types";
import type { GitArtifactType } from "git/constants/enums";

async function fetchLocalProfileRequestOld(
  baseApplicationId: string,
): AxiosPromise<FetchLocalProfileResponse> {
  return Api.get(`${GIT_BASE_URL}/profile/app/${baseApplicationId}`);
}

async function fetchLocalProfileRequestNew(
  artifactType: GitArtifactType,
  baseArtifactId: string,
): AxiosPromise<FetchLocalProfileResponse> {
  return Api.get(`${GIT_BASE_URL}/artifacts/${baseArtifactId}/profile`);
}

export default async function fetchLocalProfileRequest(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  isNew: boolean,
): AxiosPromise<FetchLocalProfileResponse> {
  if (isNew) {
    return fetchLocalProfileRequestNew(artifactType, baseArtifactId);
  } else {
    return fetchLocalProfileRequestOld(baseArtifactId);
  }
}
