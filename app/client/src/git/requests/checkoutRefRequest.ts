import type { AxiosPromise } from "axios";
import { GIT_BASE_URL } from "./constants";
import Api from "api/Api";
import type { GitArtifactType } from "git/constants/enums";
import urlArtifactType from "./helpers/urlArtifactType";
import type {
  CheckoutRefRequestParams,
  CheckoutRefResponse,
} from "./checkoutRefRequest.types";

export async function checkoutRefRequest(
  artifactType: GitArtifactType,
  branchedArtifactId: string,
  params: CheckoutRefRequestParams,
): AxiosPromise<CheckoutRefResponse> {
  return Api.get(
    `${GIT_BASE_URL}/${urlArtifactType(artifactType)}/${branchedArtifactId}/checkout-ref`,
    params,
  );
}
