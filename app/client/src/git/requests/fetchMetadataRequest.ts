import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { FetchMetadataResponse } from "./fetchMetadataRequest.types";
import type { GitArtifactType } from "git/constants/enums";
import urlArtifactType from "./helpers/urlArtifactType";

async function fetchMetadataRequestOld(
  baseApplicationId: string,
): AxiosPromise<FetchMetadataResponse> {
  return Api.get(`${GIT_BASE_URL}/metadata/app/${baseApplicationId}`);
}

async function fetchMetadataRequestNew(
  artifactType: GitArtifactType,
  baseApplicationId: string,
): AxiosPromise<FetchMetadataResponse> {
  return Api.get(
    `${GIT_BASE_URL}/${urlArtifactType(artifactType)}/${baseApplicationId}/metadata`,
  );
}

export default async function fetchMetadataRequest(
  artifactType: GitArtifactType,
  baseApplicationId: string,
  isNew: boolean,
): AxiosPromise<FetchMetadataResponse> {
  if (isNew) {
    return fetchMetadataRequestNew(artifactType, baseApplicationId);
  } else {
    return fetchMetadataRequestOld(baseApplicationId);
  }
}
