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
}

export default GitExtendedApi;
