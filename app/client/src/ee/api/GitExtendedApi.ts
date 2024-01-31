export * from "ce/api/GitExtendedApi";
import Api from "api/Api";

class GitExtendedApi extends Api {
  static baseURL = `/v1/git`;

  static async updateDefaultBranch(applicationId: string, branchName: string) {
    return Api.patch(
      `${GitExtendedApi.baseURL}/branch/app/${applicationId}/default`,
      {},
      undefined,
      { params: { branchName } },
    );
  }

  static async updateCDconfiguration(
    applicationId: string,
    enabled: boolean,
    branchName?: string,
  ) {
    return Api.post(
      `${GitExtendedApi.baseURL}/auto-deployment/config/app/${applicationId}`,
      { enabled, branchName },
    );
  }

  static async generateCDApiKey(applicationId: string) {
    return Api.post(`/v1/api-key/git/${applicationId}`);
  }
}

export default GitExtendedApi;
