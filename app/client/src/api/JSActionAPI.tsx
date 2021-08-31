import API from "api/Api";
import { AxiosPromise } from "axios";
import { JSCollection } from "entities/JSCollection";
import { ApiResponse, GenericApiResponse } from "./ApiResponses";

export interface JSCollectionCreateUpdateResponse extends ApiResponse {
  id: string;
}
export interface MoveJSCollectionRequest {
  collectionId: string;
  destinationPageId: string;
}
export interface UpdateJSObjectNameRequest {
  pageId: string;
  actionCollectionId: string;
  layoutId: string;
  newName: string;
  oldName: string;
}
class JSActionAPI extends API {
  static url = "v1/collections/actions";

  static fetchJSCollections(
    applicationId: string,
  ): AxiosPromise<GenericApiResponse<JSCollection[]>> {
    return API.get(JSActionAPI.url, { applicationId });
  }

  static createJSCollection(
    apiConfig: Partial<JSCollection>,
  ): AxiosPromise<JSCollectionCreateUpdateResponse> {
    return API.post(JSActionAPI.url, apiConfig);
  }

  static updateJSCollection(
    apiConfig: JSCollection,
  ): AxiosPromise<JSCollectionCreateUpdateResponse> {
    const jsAction = Object.assign({}, apiConfig);
    return API.put(`${JSActionAPI.url}/${jsAction.id}`, jsAction);
  }

  static deleteJSCollection(id: string) {
    return API.delete(`${JSActionAPI.url}/${id}`);
  }

  static moveJSCollection(moveRequest: MoveJSCollectionRequest) {
    return API.put(JSActionAPI.url + "/move", moveRequest);
  }

  static fetchJSCollectionsByPageId(
    pageId: string,
  ): AxiosPromise<GenericApiResponse<JSCollection[]>> {
    return API.get(JSActionAPI.url, { pageId });
  }

  static fetchJSCollectionsForViewMode(
    applicationId: string,
  ): AxiosPromise<GenericApiResponse<JSCollection[]>> {
    return API.get(`${JSActionAPI.url}/view`, { applicationId });
  }

  static updateJSObjectName(
    updateJSObjectNameRequest: UpdateJSObjectNameRequest,
  ) {
    return API.put(JSActionAPI.url + "/refactor", updateJSObjectNameRequest);
  }
}

export default JSActionAPI;
