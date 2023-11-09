import Api from "api/Api";

class GitExtendedApi extends Api {
  static baseURL = `/v1/git`;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async updateDefaultBranch(applicationId: string, branchName: string) {
    return Promise.resolve();
  }
}

export default GitExtendedApi;
