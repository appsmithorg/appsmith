import Api from "./Api";
import { AxiosPromise } from "axios";
import { GenericApiResponse } from "api/ApiResponses";

export interface Plugin {
  id: string;
  name: string;
  type: "API" | "DB";
  packageName: string;
  uiComponent: "ApiEditorForm" | "RapidApiEditorForm" | "DbEditorForm";
}

export interface DatasourceForm {
  form: [];
}

class PluginsApi extends Api {
  static url = "v1/plugins";
  static fetchPlugins(): AxiosPromise<GenericApiResponse<Plugin[]>> {
    return Api.get(PluginsApi.url);
  }

  static fetchFormConfig(
    id: string,
  ): AxiosPromise<GenericApiResponse<DatasourceForm>> {
    return Api.get(PluginsApi.url + `/${id}/form`);
  }
}

export default PluginsApi;
