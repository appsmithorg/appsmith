import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { TriggerAutocommitResponse } from "./triggerAutocommitRequest.types";
import urlArtifactType from "./helpers/urlArtifactType";
import type { GitArtifactType } from "git/constants/enums";

async function triggerAutocommitRequestOld(
  branchedApplicationId: string,
): AxiosPromise<TriggerAutocommitResponse> {
  return Api.post(`${GIT_BASE_URL}/auto-commit/app/${branchedApplicationId}`);
}

async function triggerAutocommitRequestNew(
  artifactType: GitArtifactType,
  branchedApplicationId: string,
): AxiosPromise<TriggerAutocommitResponse> {
  return Api.post(
    `${GIT_BASE_URL}/${urlArtifactType(artifactType)}/${branchedApplicationId}/auto-commit`,
  );
}

export default async function triggerAutocommitRequest(
  artifactType: GitArtifactType,
  branchedApplicationId: string,
  isNew: boolean,
): AxiosPromise<TriggerAutocommitResponse> {
  if (isNew) {
    return triggerAutocommitRequestNew(artifactType, branchedApplicationId);
  } else {
    return triggerAutocommitRequestOld(branchedApplicationId);
  }
}
