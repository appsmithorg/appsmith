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

class PropertyPaneConfigsApi extends Api {
  static url = "v1/properties";
  static fetch(
    request: PropertyPaneConfigsRequest,
  ): AxiosPromise<PropertyPaneConfigsResponse> {
    return Api.get(
      PropertyPaneConfigsApi.url + "/" + request.propertyPaneConfigsId,
    );
  }
}

export default PropertyPaneConfigsApi;
