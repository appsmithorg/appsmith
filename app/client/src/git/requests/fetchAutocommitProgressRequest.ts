import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { FetchAutocommitProgressResponse } from "./fetchAutocommitProgressRequest.types";
import urlArtifactType from "./helpers/urlArtifactType";
import type { GitArtifactType } from "git/constants/enums";

async function fetchAutocommitProgressRequestOld(
  baseApplicationId: string,
): AxiosPromise<FetchAutocommitProgressResponse> {
  return Api.get(
    `${GIT_BASE_URL}/auto-commit/progress/app/${baseApplicationId}`,
  );
}

async function fetchAutocommitProgressRequestNew(
  artifactType: GitArtifactType,
  baseArtifactId: string,
): AxiosPromise<FetchAutocommitProgressResponse> {
  return Api.get(
    `${GIT_BASE_URL}/${urlArtifactType(artifactType)}/${baseArtifactId}/auto-commit/progress`,
  );
}

export default async function fetchAutocommitProgressRequest(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  isNew: boolean,
) {
  if (isNew) {
    return fetchAutocommitProgressRequestNew(artifactType, baseArtifactId);
  } else {
    return fetchAutocommitProgressRequestOld(baseArtifactId);
  }
}
