import Api from "api/Api";
import { AxiosPromise } from "axios";
import { GenericApiResponse } from "api/ApiResponses";
import { PluginType } from "entities/Action";
import { DependencyMap } from "utils/DynamicBindingUtils";

export interface Plugin {
  id: string;
  name: string;
  type: PluginType;
  packageName: string;
  iconLocation?: string;
  uiComponent: "ApiEditorForm" | "RapidApiEditorForm" | "DbEditorForm";
  datasourceComponent: "RestAPIDatasourceForm" | "AutoForm";
  allowUserDatasources?: boolean;
  templates: Record<string, string>;
  responseType?: "TABLE" | "JSON";
  documentationLink?: string;
}

export interface PluginFormPayload {
  form: any[];
  editor: any[];
  setting: any[];
  dependencies: DependencyMap;
}

class PluginsApi extends Api {
  static url = "v1/plugins";
  static fetchPlugins(
    orgId: string,
  ): AxiosPromise<GenericApiResponse<Plugin[]>> {
    return Api.get(PluginsApi.url, { organizationId: orgId });
  }

  static fetchFormConfig(
    id: string,
  ): AxiosPromise<GenericApiResponse<PluginFormPayload>> {
    return Api.get(PluginsApi.url + `/${id}/form`);
  }
}

export default PluginsApi;
