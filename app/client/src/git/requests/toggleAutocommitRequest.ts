import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { ToggleAutocommitResponse } from "./toggleAutocommitRequest.types";
import type { GitArtifactType } from "git/constants/enums";

async function toggleAutocommitRequestOld(
  baseApplicationId: string,
): AxiosPromise<ToggleAutocommitResponse> {
  return Api.patch(
    `${GIT_BASE_URL}/auto-commit/toggle/app/${baseApplicationId}`,
  );
}

async function toggleAutocommitRequestNew(
  artifactType: GitArtifactType,
  baseArtifactId: string,
): AxiosPromise<ToggleAutocommitResponse> {
  return Api.patch(
    `${GIT_BASE_URL}/${artifactType}/${baseArtifactId}/auto-commit/toggle`,
  );
}

export default async function toggleAutocommitRequest(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  isNew: boolean,
): AxiosPromise<ToggleAutocommitResponse> {
  if (isNew) {
    return toggleAutocommitRequestNew(artifactType, baseArtifactId);
  } else {
    return toggleAutocommitRequestOld(baseArtifactId);
  }
}
