export interface CheckoutBranchRequestParams {
  branchName: string;
}

export interface CheckoutBranchResponse {
  id: string; // applicationId
  baseId: string; // baseApplicationId
}
