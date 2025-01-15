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
  baseArtifactId: string,
  params: FetchStatusRequestParams,
): AxiosPromise<FetchStatusResponse> {
  return Api.get(
    `${GIT_BASE_URL}/${urlArtifactType(artifactType)}/${baseArtifactId}/status`,
    params,
  );
}

export default async function fetchStatusRequest(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  params: FetchStatusRequestParams,
  isNew: boolean,
): AxiosPromise<FetchStatusResponse> {
  if (isNew) {
    return fetchStatusRequestNew(artifactType, baseArtifactId, params);
  } else {
    return fetchStatusRequestOld(baseArtifactId, params);
  }
}
