import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { ToggleAutocommitResponse } from "./toggleAutocommitRequest.types";
import type { GitArtifactType } from "git/constants/enums";
import urlArtifactType from "./helpers/urlArtifactType";

async function toggleAutocommitRequestOld(
  baseApplicationId: string,
): AxiosPromise<ToggleAutocommitResponse> {
  return Api.patch(
    `${GIT_BASE_URL}/auto-commit/toggle/app/${baseApplicationId}`,
  );
}

async function toggleAutocommitRequestNew(
  artifactType: GitArtifactType,
  baseApplicationId: string,
): AxiosPromise<ToggleAutocommitResponse> {
  return Api.patch(
    `${GIT_BASE_URL}/${urlArtifactType(artifactType)}/${baseApplicationId}/auto-commit/toggle`,
  );
}

export default async function toggleAutocommitRequest(
  artifactType: GitArtifactType,
  baseApplicationId: string,
  isNew: boolean,
): AxiosPromise<ToggleAutocommitResponse> {
  if (isNew) {
    return toggleAutocommitRequestNew(artifactType, baseApplicationId);
  } else {
    return toggleAutocommitRequestOld(baseApplicationId);
  }
}
