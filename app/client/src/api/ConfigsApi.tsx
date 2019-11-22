import Api from "./Api";
import { ApiResponse } from "./ApiResponses";
import { PropertyConfig } from "../reducers/entityReducers/propertyPaneConfigReducer";
import { AxiosPromise } from "axios";

export interface PropertyPaneConfigsResponse extends ApiResponse {
  data: {
    config: PropertyConfig;
  };
}

export interface PropertyPaneConfigsRequest {
  propertyPaneConfigsId: string;
}

class ConfigsApi extends Api {
  static baseURL = "v1/configs/name/";
  static fetchPropertyPane(): AxiosPromise<PropertyPaneConfigsResponse> {
    return Api.get(ConfigsApi.baseURL + "propertyPane");
  }
}

export default ConfigsApi;
