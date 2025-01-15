import type { AxiosPromise } from "axios";
import type {
  UpdateLocalProfileRequestParams,
  UpdateLocalProfileResponse,
} from "./updateLocalProfileRequest.types";
import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import urlArtifactType from "./helpers/urlArtifactType";
import type { GitArtifactType } from "git/constants/enums";

async function updateLocalProfileRequestOld(
  baseApplicationId: string,
  params: UpdateLocalProfileRequestParams,
): AxiosPromise<UpdateLocalProfileResponse> {
  return Api.put(`${GIT_BASE_URL}/profile/app/${baseApplicationId}`, params);
}

async function updateLocalProfileRequestNew(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  params: UpdateLocalProfileRequestParams,
): AxiosPromise<UpdateLocalProfileResponse> {
  return Api.put(
    `${GIT_BASE_URL}/${urlArtifactType(artifactType)}/${baseArtifactId}/profile`,
    params,
  );
}

export default async function updateLocalProfileRequest(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  params: UpdateLocalProfileRequestParams,
  isNew: boolean,
): AxiosPromise<UpdateLocalProfileResponse> {
  if (isNew) {
    return updateLocalProfileRequestNew(artifactType, baseArtifactId, params);
  } else {
    return updateLocalProfileRequestOld(baseArtifactId, params);
  }
}
