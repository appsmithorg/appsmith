import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type {
  UpdateProtectedBranchesRequestParams,
  UpdateProtectedBranchesResponse,
} from "./updateProtectedBranchesRequest.types";
import type { AxiosPromise } from "axios";
import type { GitArtifactType } from "git/constants/enums";

async function updateProtectedBranchesRequestOld(
  baseApplicationId: string,
  params: UpdateProtectedBranchesRequestParams,
): AxiosPromise<UpdateProtectedBranchesResponse> {
  return Api.post(
    `${GIT_BASE_URL}/branch/app/${baseApplicationId}/protected`,
    params,
  );
}

async function updateProtectedBranchesRequestNew(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  params: UpdateProtectedBranchesRequestParams,
): AxiosPromise<UpdateProtectedBranchesResponse> {
  return Api.post(
    `${GIT_BASE_URL}/${artifactType}/${baseArtifactId}/protected-branches`,
    params,
  );
}

export default async function updateProtectedBranchesRequest(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  params: UpdateProtectedBranchesRequestParams,
  isNew: boolean,
): AxiosPromise<UpdateProtectedBranchesResponse> {
  if (isNew) {
    return updateProtectedBranchesRequestNew(
      artifactType,
      baseArtifactId,
      params,
    );
  } else {
    return updateProtectedBranchesRequestOld(baseArtifactId, params);
  }
}
