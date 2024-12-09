import type { AxiosResponse } from "axios";
import type {
  CheckoutBranchRequestParams,
  CheckoutBranchResponse,
} from "./checkoutBranchRequest.types";
import { GIT_BASE_URL } from "./constants";
import Api from "api/Api";

export default async function checkoutBranchRequest(
  branchedApplicationId: string,
  params: CheckoutBranchRequestParams,
): Promise<AxiosResponse<CheckoutBranchResponse>> {
  return Api.get(
    `${GIT_BASE_URL}/checkout-branch/app/${branchedApplicationId}`,
    params,
  );
}
