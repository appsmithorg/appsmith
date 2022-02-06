import API from "api/Api";
import { AxiosPromise } from "axios";
import { JSCollection } from "entities/JSCollection";
import { ApiResponse, GenericApiResponse } from "./ApiResponses";
import { Variable, JSAction } from "entities/JSCollection";
import { PluginType } from "entities/Action";
export interface JSCollectionCreateUpdateResponse extends ApiResponse {
  id: string;
}
export interface MoveJSCollectionRequest {
  collectionId: string;
  destinationPageId: string;
  name: string;
}
export interface UpdateJSObjectNameRequest {
  pageId: string;
  actionCollectionId: string;
  layoutId: string;
  newName: string;
  oldName: string;
}

export interface CreateJSCollectionRequest {
  name: string;
  pageId: string;
  organizationId: string;
  pluginId: string;
  body: string;
  variables: Array<Variable>;
  actions: Array<Partial<JSAction>>;
  applicationId: string;
  pluginType: PluginType;
}

export interface RefactorAction {
  pageId: string;
  actionId: string;
  newName: string;
  oldName: string;
  collectionName: string;
}
export interface RefactorActionRequest extends RefactorAction {
  layoutId: string;
}

export interface UpdateCollectionActionNameRequest {
  refactorAction: RefactorActionRequest;
  actionCollection: JSCollection;
}
class JSActionAPI extends API {
  static url = "v1/collections/actions";

  static fetchJSCollections(
    applicationId: string,
  ): AxiosPromise<GenericApiResponse<JSCollection[]>> {
    return API.get(JSActionAPI.url, { applicationId });
  }

  static createJSCollection(
    jsConfig: CreateJSCollectionRequest,
  ): AxiosPromise<JSCollectionCreateUpdateResponse> {
    return API.post(JSActionAPI.url, jsConfig);
  }

  static copyJSCollection(
    jsConfig: Partial<JSCollection>,
  ): AxiosPromise<JSCollectionCreateUpdateResponse> {
    return API.post(JSActionAPI.url, jsConfig);
  }

  static updateJSCollection(
    jsConfig: JSCollection,
  ): AxiosPromise<JSCollectionCreateUpdateResponse> {
    const jsAction = Object.assign({}, jsConfig);
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

  static updateJSCollectionOrActionName(
    updateJSObjectNameRequest: UpdateJSObjectNameRequest,
  ) {
    return API.put(JSActionAPI.url + "/refactor", updateJSObjectNameRequest);
  }

  static updateJSCollectionActionRefactor(
    updateJSCollectionActionName: UpdateCollectionActionNameRequest,
  ) {
    return API.put(
      JSActionAPI.url + "/refactorAction",
      updateJSCollectionActionName,
    );
  }
}

export default JSActionAPI;
