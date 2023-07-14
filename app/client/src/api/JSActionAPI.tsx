import API from "api/Api";
import type { AxiosPromise } from "axios";
import type { JSCollection } from "entities/JSCollection";
import type { ApiResponse } from "./ApiResponses";
import type { Variable, JSAction } from "entities/JSCollection";
import type { PluginType } from "entities/Action";

export type JSCollectionCreateUpdateResponse = ApiResponse & {
  id: string;
};

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
  workspaceId: string;
  pluginId: string;
  body: string;
  variables: Array<Variable>;
  actions: Array<Partial<JSAction>>;
  applicationId: string;
  pluginType: PluginType;
}

export type SetFunctionPropertyPayload = {
  action: JSAction;
  propertyName: string;
  value: any;
};
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
export interface GenerateServerSideURLRequest {
  baseUrl: string; // This can be captured from web exchange but keeping this flexibility if the server is hosted under the VPN and APIs are routed via nginx
  collectionId: string;
  actionId: string;
  revoke?: boolean; //(Optional field to revoke the url and the default value will be false)
}
class JSActionAPI extends API {
  static url = "v1/collections/actions";

  static fetchJSCollections(
    applicationId: string,
  ): AxiosPromise<ApiResponse<JSCollection[]>> {
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
  ): AxiosPromise<ApiResponse<JSCollection[]>> {
    return API.get(JSActionAPI.url, { pageId });
  }

  static fetchJSCollectionsForViewMode(
    applicationId: string,
  ): AxiosPromise<ApiResponse<JSCollection[]>> {
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
  static generateServersideURL(data: GenerateServerSideURLRequest) {
    return API.put("v1/server-execution", data);
  }
}

export default JSActionAPI;
