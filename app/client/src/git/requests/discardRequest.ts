import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { DiscardResponse } from "./discardRequest.types";
import urlArtifactType from "./helpers/urlArtifactType";
import type { GitArtifactType } from "git/constants/enums";

async function discardRequestOld(
  branchedApplicationId: string,
): AxiosPromise<DiscardResponse> {
  return Api.put(`${GIT_BASE_URL}/discard/app/${branchedApplicationId}`);
}

async function discardRequestNew(
  artifactType: GitArtifactType,
  refArtifactId: string,
): AxiosPromise<DiscardResponse> {
  return Api.put(
    `${GIT_BASE_URL}/${urlArtifactType(artifactType)}/${refArtifactId}/discard`,
  );
}

export default async function discardRequest(
  artifactType: GitArtifactType,
  refArtifactId: string,
  isNew: boolean,
) {
  if (isNew) {
    return discardRequestNew(artifactType, refArtifactId);
  } else {
    return discardRequestOld(refArtifactId);
  }
}
