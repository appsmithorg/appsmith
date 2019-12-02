import Api from "./Api";
import { AxiosPromise } from "axios";
import { GenericApiResponse } from "api/ApiResponses";

export interface Plugin {
  id: string;
  name: string;
  type: "API" | "DB";
}

class PluginsApi extends Api {
  static url = "v1/plugins";
  static fetchPlugins(): AxiosPromise<GenericApiResponse<Plugin[]>> {
    return Api.get(PluginsApi.url);
  }
}

export default PluginsApi;
