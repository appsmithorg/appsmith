import Api from "api/Api";
import type { AxiosPromise } from "axios";
import type { ApiResponse } from "api/ApiResponses";
import type { PluginPackageName, PluginType } from "entities/Action";
import type { DependencyMap } from "utils/DynamicBindingUtils";
import { FILE_UPLOAD_TRIGGER_TIMEOUT_MS } from "@appsmith/constants/ApiConstants";

export type PluginId = string;
export type GenerateCRUDEnabledPluginMap = Record<PluginId, PluginPackageName>;

export enum UIComponentTypes {
  DbEditorForm = "DbEditorForm",
  UQIDbEditorForm = "UQIDbEditorForm",
  ApiEditorForm = "ApiEditorForm",
  JsEditorForm = "JsEditorForm",
}

export enum DatasourceComponentTypes {
  RestAPIDatasourceForm = "RestAPIDatasourceForm",
  AutoForm = "AutoForm",
}
export interface Plugin {
  id: string;
  name: string;
  type: PluginType;
  packageName: PluginPackageName;
  iconLocation?: string;
  uiComponent: UIComponentTypes;
  datasourceComponent: DatasourceComponentTypes;
  allowUserDatasources?: boolean;
  templates: Record<string, string>;
  responseType?: "TABLE" | "JSON";
  documentationLink?: string;
  generateCRUDPageComponent?: string;
  // We need to know if the plugin requires a datasource (Eg Workflows plugin does not require a datasource to create queries)
  requiresDatasource: boolean;
}

export interface PluginFormPayload {
  form: any[];
  editor: any[];
  setting: any[];
  dependencies: DependencyMap;
  formButton: string[];
}

export interface DefaultPlugin {
  id: string;
  name: string;
  packageName: string;
  iconLocation?: string;
  allowUserDatasources?: boolean;
}

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
