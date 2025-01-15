import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { PullResponse } from "./pullRequest.types";
import urlArtifactType from "./helpers/urlArtifactType";
import type { GitArtifactType } from "git/constants/enums";

async function pullRequestOld(
  branchedApplicationId: string,
): AxiosPromise<PullResponse> {
  return Api.get(`${GIT_BASE_URL}/pull/app/${branchedApplicationId}`);
}

async function pullRequestNew(
  artifactType: GitArtifactType,
  refArtifactId: string,
): AxiosPromise<PullResponse> {
  return Api.get(
    `${GIT_BASE_URL}/${urlArtifactType(artifactType)}/${refArtifactId}/pull`,
  );
}

export default async function pullRequest(
  artifactType: GitArtifactType,
  refArtifactId: string,
  isNew: boolean,
): AxiosPromise<PullResponse> {
  if (isNew) {
    return pullRequestNew(artifactType, refArtifactId);
  } else {
    return pullRequestOld(refArtifactId);
  }
}
