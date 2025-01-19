import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type {
  ConnectRequestParams,
  ConnectResponse,
} from "./connectRequest.types";
import type { AxiosPromise } from "axios";
import type { GitArtifactType } from "git/constants/enums";

async function connectRequestOld(
  baseApplicationId: string,
  params: ConnectRequestParams,
): AxiosPromise<ConnectResponse> {
  return Api.post(`${GIT_BASE_URL}/connect/app/${baseApplicationId}`, params);
}

async function connectRequestNew(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  params: ConnectRequestParams,
): AxiosPromise<ConnectResponse> {
  return Api.post(
    `${GIT_BASE_URL}/${artifactType}/${baseArtifactId}/connect`,
    params,
  );
}

export default async function connectRequest(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  params: ConnectRequestParams,
  isNew: boolean,
) {
  if (isNew) {
    return connectRequestNew(artifactType, baseArtifactId, params);
  } else {
    return connectRequestOld(baseArtifactId, params);
  }
}
