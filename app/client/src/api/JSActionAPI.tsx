import API from "api/Api";
import { AxiosPromise } from "axios";
import { JSAction } from "entities/JSAction";
import { ApiResponse, GenericApiResponse } from "./ApiResponses";
export interface JSActionCreateUpdateResponse extends ApiResponse {
  id: string;
}
export interface MoveJSActionRequest {
  collectionId: string;
  destinationPageId: string;
}
export interface UpdateJSCollectionNameRequest {
  pageId: string;
  actionCollectionId: string;
  layoutId: string;
  newName: string;
  oldName: string;
}
class JSActionAPI extends API {
  static url = "v1/collections/actions";

  static fetchJSActions(
    applicationId: string,
  ): AxiosPromise<GenericApiResponse<JSAction[]>> {
    return API.get(JSActionAPI.url, { applicationId });
  }

  static createJSAction(
    apiConfig: Partial<JSAction>,
  ): AxiosPromise<JSActionCreateUpdateResponse> {
    return API.post(JSActionAPI.url, apiConfig);
  }

  static updateJSAction(
    apiConfig: Partial<JSAction>,
  ): AxiosPromise<JSActionCreateUpdateResponse> {
    const jsAction = Object.assign({}, apiConfig);
    return API.put(`${JSActionAPI.url}/${jsAction.id}`, jsAction);
  }

  static deleteJSAction(id: string) {
    return API.delete(`${JSActionAPI.url}/${id}`);
  }

  static moveJSAction(moveRequest: MoveJSActionRequest) {
    return API.put(JSActionAPI.url + "/move", moveRequest);
  }

  static fetchJSActionsByPageId(
    pageId: string,
  ): AxiosPromise<GenericApiResponse<JSAction[]>> {
    return API.get(JSActionAPI.url, { pageId });
  }

  static updateJSCollectionName(
    updateJSCollectionNameRequest: UpdateJSCollectionNameRequest,
  ) {
    return API.put(
      JSActionAPI.url + "/refactor",
      updateJSCollectionNameRequest,
    );
  }
}

export default JSActionAPI;
