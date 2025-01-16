import type { AxiosPromise } from "axios";
import type {
  DeleteRefRequestParams,
  DeleteRefResponse,
} from "./deleteRefRequest.types";
import { GIT_BASE_URL } from "./constants";
import Api from "api/Api";
import type { GitArtifactType } from "git/constants/enums";
import deleteBranchRequestOld from "./deleteBranchRequest";

async function deleteRefRequestNew(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  params: DeleteRefRequestParams,
): AxiosPromise<DeleteRefResponse> {
  return Api.delete(
    `${GIT_BASE_URL}/${artifactType}/${baseArtifactId}/ref`,
    params,
  );
}

export default async function deleteRefRequest(
  artifactType: GitArtifactType,
  baseArtifactId: string,
  params: DeleteRefRequestParams,
  isNew: boolean,
) {
  if (isNew) {
    return deleteRefRequestNew(artifactType, baseArtifactId, params);
  } else {
    const deleteBranchParams = {
      branchName: params.refName,
    };

    return deleteBranchRequestOld(baseArtifactId, deleteBranchParams);
  }
}
