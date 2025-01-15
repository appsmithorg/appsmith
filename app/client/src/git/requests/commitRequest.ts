import Api from "api/Api";
import type {
  CommitRequestParams,
  CommitResponse,
} from "./commitRequest.types";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { GitArtifactType } from "git/constants/enums";
import urlArtifactType from "./helpers/urlArtifactType";

async function commitRequestOld(
  branchedApplicationId: string,
  params: CommitRequestParams,
): AxiosPromise<CommitResponse> {
  return Api.post(
    `${GIT_BASE_URL}/commit/app/${branchedApplicationId}`,
    params,
  );
}

async function commitRequestNew(
  artifactType: GitArtifactType,
  refArtifactId: string,
  params: CommitRequestParams,
): AxiosPromise<CommitResponse> {
  return Api.post(
    `${GIT_BASE_URL}/${urlArtifactType(artifactType)}/${refArtifactId}/commit`,
    params,
  );
}

export default async function commitRequest(
  artifactType: GitArtifactType,
  refArtifactId: string,
  params: CommitRequestParams,
  isNew: boolean,
) {
  if (isNew) {
    return commitRequestNew(artifactType, refArtifactId, params);
  } else {
    return commitRequestOld(refArtifactId, params);
  }
}
