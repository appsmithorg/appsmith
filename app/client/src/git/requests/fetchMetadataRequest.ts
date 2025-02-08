import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { FetchMetadataResponse } from "./fetchMetadataRequest.types";
import type { GitArtifactType } from "git/constants/enums";

async function fetchMetadataRequestOld(
  baseApplicationId: string,
): AxiosPromise<FetchMetadataResponse> {
  return Api.get(`${GIT_BASE_URL}/metadata/app/${baseApplicationId}`);
}

async function fetchMetadataRequestNew(
  artifactType: GitArtifactType,
  baseArtifactId: string,
): AxiosPromise<FetchMetadataResponse> {
  return Api.get(`${GIT_BASE_URL}/${artifactType}/${baseArtifactId}/metadata`);
}

export default async function fetchMetadataRequest(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  isNew: boolean,
): AxiosPromise<FetchMetadataResponse> {
  if (isNew) {
    return fetchMetadataRequestNew(artifactType, baseArtifactId);
  } else {
    return fetchMetadataRequestOld(baseArtifactId);
  }
}
