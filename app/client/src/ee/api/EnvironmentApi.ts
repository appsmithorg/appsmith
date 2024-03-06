import Api from "api/Api";

class EnvironmentApi extends Api {
  static environmentsUrl = "v1/environments";
  static fetchEnvByWorkspaceIdUrl = "/workspaces";

  // endpoint to fetch the env and env variables
  static async fetchEnvironmentConfigs({
    fetchDatasourceMeta,
    workspaceId,
  }: {
    workspaceId: string;
    fetchDatasourceMeta?: boolean;
  }) {
    const url =
      EnvironmentApi.environmentsUrl +
      EnvironmentApi.fetchEnvByWorkspaceIdUrl +
      "/" +
      workspaceId +
      `${!!fetchDatasourceMeta ? "?fetchDatasourceMeta=true" : ""}`;
    return Api.get(url);
  }

  // endpoint to create new env
  static async createEnvironment(payload: {
    environmentName: string;
    workspaceId: string;
  }) {
    const url = EnvironmentApi.environmentsUrl;
    return Api.post(url, payload);
  }

  // endpoint to update env
  static async updateEnvironment({
    environmentId,
    newEnvironmentName,
  }: {
    environmentId: string;
    newEnvironmentName: string;
  }) {
    const url = EnvironmentApi.environmentsUrl + `/${environmentId}`;
    return Api.put(url, { name: newEnvironmentName });
  }

  // endpoint to delete env
  static async deleteEnvironment(payload: { environmentId: string }) {
    const url = EnvironmentApi.environmentsUrl + `/${payload.environmentId}`;
    return Api.delete(url);
  }
}

export default EnvironmentApi;
