import Api from "api/Api";
import type {
  FetchStatusRequestParams,
  FetchStatusResponse,
} from "./fetchStatusRequest.types";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import urlArtifactType from "./helpers/urlArtifactType";
import type { GitArtifactType } from "git/constants/enums";

async function fetchStatusRequestOld(
  branchedApplicationId: string,
  params: FetchStatusRequestParams = { compareRemote: true },
): AxiosPromise<FetchStatusResponse> {
  return Api.get(`${GIT_BASE_URL}/status/app/${branchedApplicationId}`, params);
}

async function fetchStatusRequestNew(
  artifactType: GitArtifactType,
  branchedApplicationId: string,
  params: FetchStatusRequestParams,
): AxiosPromise<FetchStatusResponse> {
  return Api.get(
    `${GIT_BASE_URL}/${urlArtifactType(artifactType)}/${branchedApplicationId}/status`,
    params,
  );
}

export default async function fetchStatusRequest(
  artifactType: GitArtifactType,
  branchedApplicationId: string,
  params: FetchStatusRequestParams,
  isNew: boolean,
): AxiosPromise<FetchStatusResponse> {
  if (isNew) {
    return fetchStatusRequestNew(artifactType, branchedApplicationId, params);
  } else {
    return fetchStatusRequestOld(branchedApplicationId, params);
  }
}
