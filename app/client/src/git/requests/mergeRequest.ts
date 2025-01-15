import Api from "api/Api";
import type { MergeRequestParams, MergeResponse } from "./mergeRequest.types";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { GitArtifactType } from "git/constants/enums";
import urlArtifactType from "./helpers/urlArtifactType";

async function mergeRequestOld(
  branchedApplicationId: string,
  params: MergeRequestParams,
): AxiosPromise<MergeResponse> {
  return Api.post(`${GIT_BASE_URL}/merge/app/${branchedApplicationId}`, params);
}

async function mergeRequestNew(
  artifactType: GitArtifactType,
  branchedApplicationId: string,
  params: MergeRequestParams,
): AxiosPromise<MergeResponse> {
  return Api.post(
    `${GIT_BASE_URL}/${urlArtifactType(artifactType)}/${branchedApplicationId}/merge`,
    params,
  );
}

export default async function mergeRequest(
  artifactType: GitArtifactType,
  branchedApplicationId: string,
  params: MergeRequestParams,
  isNew: boolean,
): AxiosPromise<MergeResponse> {
  if (isNew) {
    return mergeRequestNew(artifactType, branchedApplicationId, params);
  } else {
    return mergeRequestOld(branchedApplicationId, params);
  }
}
