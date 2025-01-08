import Api from "api/Api";
import { FILE_UPLOAD_TRIGGER_TIMEOUT_MS } from "ee/constants/ApiConstants";
import type {
  ApiResponse,
  AxiosPromise,
  Plugin,
  PluginFormPayload,
  DefaultPlugin,
  UIComponentTypes,
  DatasourceComponentTypes,
} from "./PluginApi.types";

class PluginsApi extends Api {
  static url = "v1/plugins";
  static defaultDynamicTriggerURL(datasourceId: string): string {
    return `/v1/datasources/${datasourceId}/trigger`;
  }
  static dynamicTriggerURLForInternalPlugins(pluginId: string): string {
    return `/${PluginsApi.url}/${pluginId}/trigger`;
  }
  static async fetchPlugins(
    workspaceId: string,
  ): Promise<AxiosPromise<ApiResponse<Plugin[]>>> {
    return Api.get(PluginsApi.url, { workspaceId: workspaceId });
  }

  static async fetchFormConfig(
    id: string,
  ): Promise<AxiosPromise<ApiResponse<PluginFormPayload>>> {
    return Api.get(PluginsApi.url + `/${id}/form`);
  }

  // Definition to fetch the dynamic data via the URL passed in the config
  static async fetchDynamicFormValues(
    url: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: Record<string, any>,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.post(url, body);
  }

  static async fetchDefaultPlugins(): Promise<
    AxiosPromise<ApiResponse<DefaultPlugin[]>>
  > {
    return Api.get(PluginsApi.url + `/default/icons`);
  }

  static async uploadFiles(
    pluginId: string,
    files: File[],
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params?: Record<string, any>,
  ): Promise<AxiosPromise<ApiResponse>> {
    const url = this.dynamicTriggerURLForInternalPlugins(pluginId);
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    if (params) {
      Object.keys(params).forEach((key) => {
        formData.append(key, params[key]);
      });
    }

    return Api.post(
      url,
      formData,
      {},
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: FILE_UPLOAD_TRIGGER_TIMEOUT_MS,
      },
    );
  }
}

export default PluginsApi;
