import type { AxiosPromise } from "axios";
import type {
  FetchMergeStatusRequestParams,
  FetchMergeStatusResponse,
} from "./fetchMergeStatusRequest.types";
import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { GitArtifactType } from "git/constants/enums";

async function fetchMergeStatusRequestOld(
  branchedApplicationId: string,
  params: FetchMergeStatusRequestParams,
): AxiosPromise<FetchMergeStatusResponse> {
  return Api.post(
    `${GIT_BASE_URL}/merge/status/app/${branchedApplicationId}`,
    params,
  );
}

async function fetchMergeStatusRequestNew(
  artifactType: GitArtifactType,
  refArtifactId: string,
  params: FetchMergeStatusRequestParams,
): AxiosPromise<FetchMergeStatusResponse> {
  return Api.post(
    `${GIT_BASE_URL}/${artifactType}/${refArtifactId}/merge/status`,
    params,
  );
}

export default async function fetchMergeStatusRequest(
  artifactType: GitArtifactType,
  refArtifactId: string,
  params: FetchMergeStatusRequestParams,
  isNew: boolean,
): AxiosPromise<FetchMergeStatusResponse> {
  if (isNew) {
    return fetchMergeStatusRequestNew(artifactType, refArtifactId, params);
  } else {
    return fetchMergeStatusRequestOld(refArtifactId, params);
  }
}
