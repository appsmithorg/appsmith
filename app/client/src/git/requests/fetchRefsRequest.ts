import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type {
  FetchRefsRequestParams,
  FetchRefsResponse,
} from "./fetchRefsRequest.types";
import type { AxiosPromise } from "axios";
import type { GitArtifactType } from "git/constants/enums";
import fetchBranchesRequest from "./fetchBranchesRequest";

async function fetchRefsRequestNew(
  artifactType: GitArtifactType,
  refArtifactId: string,
  params: FetchRefsRequestParams,
): AxiosPromise<FetchRefsResponse> {
  return Api.get(
    `${GIT_BASE_URL}/${artifactType}/${refArtifactId}/refs`,
    undefined,
    { params },
  );
}

export default async function fetchRefsRequest(
  artifactType: GitArtifactType,
  refArtifactId: string,
  params: FetchRefsRequestParams,
  isNew: boolean,
) {
  if (isNew) {
    return fetchRefsRequestNew(artifactType, refArtifactId, params);
  } else {
    const fetchBranchesParams = {
      pruneBranches: params.pruneRefs,
    };

    return fetchBranchesRequest(refArtifactId, fetchBranchesParams);
  }
}
