import Api from "api/Api";

class EnvironmentApi extends Api {
  static environmentsUrl = "v1/environments";
  static fetchEnvByWorkspaceIdUrl = "/workspaces";

  // endpoint to fetch the env and env variables
  static async fetchEnvironmentConfigs(workspaceId: string) {
    const url =
      EnvironmentApi.environmentsUrl +
      EnvironmentApi.fetchEnvByWorkspaceIdUrl +
      "/" +
      workspaceId;
    return Api.get(url);
  }
}

export default EnvironmentApi;
