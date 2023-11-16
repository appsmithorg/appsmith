import API from "api/Api";
import type { AxiosPromise } from "axios";
import type { JSCollection } from "entities/JSCollection";
import type { ApiResponse } from "../../api/ApiResponses";
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

export interface SetFunctionPropertyPayload {
  action: JSAction;
  propertyName: string;
  value: any;
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

export interface UpdateCollectionActionNameRequest
  extends RefactorActionRequest {
  actionCollection: JSCollection;
}
class JSActionAPI extends API {
  static url = "v1/collections/actions";

  static async fetchJSCollections(
    applicationId: string,
  ): Promise<AxiosPromise<ApiResponse<JSCollection[]>>> {
    return API.get(JSActionAPI.url, { applicationId });
  }

  static async createJSCollection(
    jsConfig: CreateJSCollectionRequest,
  ): Promise<AxiosPromise<JSCollectionCreateUpdateResponse>> {
    return API.post(JSActionAPI.url, jsConfig);
  }

  static async copyJSCollection(
    jsConfig: Partial<JSCollection>,
  ): Promise<AxiosPromise<JSCollectionCreateUpdateResponse>> {
    return API.post(JSActionAPI.url, jsConfig);
  }

  static async updateJSCollection(
    jsConfig: JSCollection,
  ): Promise<AxiosPromise<JSCollectionCreateUpdateResponse>> {
    const jsAction = Object.assign({}, jsConfig);
    return API.put(`${JSActionAPI.url}/${jsAction.id}`, jsAction);
  }

  static async deleteJSCollection(id: string) {
    return API.delete(`${JSActionAPI.url}/${id}`);
  }

  static async moveJSCollection(moveRequest: MoveJSCollectionRequest) {
    return API.put(JSActionAPI.url + "/move", moveRequest);
  }

  static async fetchJSCollectionsByPageId(
    pageId: string,
  ): Promise<AxiosPromise<ApiResponse<JSCollection[]>>> {
    return API.get(JSActionAPI.url, { pageId });
  }

  static async fetchJSCollectionsForViewMode(
    applicationId: string,
  ): Promise<AxiosPromise<ApiResponse<JSCollection[]>>> {
    return API.get(`${JSActionAPI.url}/view`, { applicationId });
  }

  static async updateJSCollectionOrActionName(
    updateJSObjectNameRequest: UpdateJSObjectNameRequest,
  ) {
    return API.put(JSActionAPI.url + "/refactor", updateJSObjectNameRequest);
  }

  static async updateJSCollectionActionRefactor(
    updateJSCollectionActionName: UpdateCollectionActionNameRequest,
  ) {
    return API.put(
      JSActionAPI.url + "/refactorAction",
      updateJSCollectionActionName,
    );
  }
}

export default JSActionAPI;
