import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { FetchProtectedBranchesResponse } from "./fetchProtectedBranchesRequest.types";
import type { GitArtifactType } from "git/constants/enums";
import urlArtifactType from "./helpers/urlArtifactType";

async function fetchProtectedBranchesRequestOld(
  baseApplicationId: string,
): AxiosPromise<FetchProtectedBranchesResponse> {
  return Api.get(`${GIT_BASE_URL}/branch/app/${baseApplicationId}/protected`);
}

async function fetchProtectedBranchesRequestNew(
  artifactType: GitArtifactType,
  baseApplicationId: string,
): AxiosPromise<FetchProtectedBranchesResponse> {
  return Api.get(
    `${GIT_BASE_URL}/${urlArtifactType(artifactType)}/${baseApplicationId}/protected`,
  );
}

export default async function fetchProtectedBranchesRequest(
  artifactType: GitArtifactType,
  baseApplicationId: string,
  isNew: boolean,
): AxiosPromise<FetchProtectedBranchesResponse> {
  if (isNew) {
    return fetchProtectedBranchesRequestNew(artifactType, baseApplicationId);
  } else {
    return fetchProtectedBranchesRequestOld(baseApplicationId);
  }
}
