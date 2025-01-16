import type { AxiosPromise } from "axios";
import { GIT_BASE_URL } from "./constants";
import Api from "api/Api";
import type { GitArtifactType } from "git/constants/enums";
import type {
  CheckoutRefRequestParams,
  CheckoutRefResponse,
} from "./checkoutRefRequest.types";
import checkoutBranchRequestOld from "./checkoutBranchRequest";

async function checkoutRefRequestNew(
  artifactType: GitArtifactType,
  refArtifactid: string,
  params: CheckoutRefRequestParams,
): AxiosPromise<CheckoutRefResponse> {
  return Api.post(
    `${GIT_BASE_URL}/${artifactType}/${refArtifactid}/checkout-ref`,
    params,
  );
}

export default async function checkoutRefRequest(
  artifactType: GitArtifactType,
  refArtifactid: string,
  params: CheckoutRefRequestParams,
  isNew: boolean,
) {
  if (isNew) {
    return checkoutRefRequestNew(artifactType, refArtifactid, params);
  } else {
    const checkoutBranchParams = {
      branchName: params.refName,
    };

    return checkoutBranchRequestOld(refArtifactid, checkoutBranchParams);
  }
}
