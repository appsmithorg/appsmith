import Api from "./Api";
import { ApiResponse } from "./ApiResponses";
import { PropertyConfig } from "../reducers/entityReducers/propertyPaneConfigReducer";

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
  ): Promise<PropertyPaneConfigsResponse> {
    return Api.get(
      PropertyPaneConfigsApi.url + "/" + request.propertyPaneConfigsId,
    );
  }
}

export default PropertyPaneConfigsApi;
