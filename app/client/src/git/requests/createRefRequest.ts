import type { AxiosPromise } from "axios";
import { GIT_BASE_URL } from "./constants";
import Api from "api/Api";
import type { GitArtifactType } from "git/constants/enums";
import type {
  CreateRefRequestParams,
  CreateRefResponse,
} from "./createRefRequest.types";
import createBranchRequestOld from "./createBranchRequest";

async function createRefRequestNew(
  artifactType: GitArtifactType,
  refArtifactId: string,
  params: CreateRefRequestParams,
): AxiosPromise<CreateRefResponse> {
  return Api.post(
    `${GIT_BASE_URL}/${artifactType}/${refArtifactId}/create-ref`,
    params,
  );
}

export default async function createRefRequest(
  artifactType: GitArtifactType,
  refArtifactId: string,
  params: CreateRefRequestParams,
  isNew: boolean,
) {
  if (isNew) {
    return createRefRequestNew(artifactType, refArtifactId, params);
  } else {
    const createBranchParams = {
      branchName: params.refName,
    };

    return createBranchRequestOld(refArtifactId, createBranchParams);
  }
}
