import API from "api/Api";
import type { AxiosPromise } from "axios";
import type { JSCollection } from "entities/JSCollection";
import type { ApiResponse } from "api/ApiResponses";
import type { Variable, JSAction } from "entities/JSCollection";
import type { PluginType } from "entities/Action";
import type { FetchActionsPayload } from "api/ActionAPI";
import type { ActionParentEntityTypeInterface } from "ee/entities/Engine/actionHelpers";

export type JSCollectionCreateUpdateResponse = ApiResponse<JSCollection>;

export interface MoveJSCollectionRequest {
  collectionId: string;
  destinationPageId: string;
  name: string;
}
export interface UpdateJSObjectNameRequest {
  pageId?: string;
  actionCollectionId: string;
  layoutId?: string;
  newName: string;
  oldName: string;
  moduleId?: string;
  workflowId?: string;
  contextType?: ActionParentEntityTypeInterface;
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
  workflowId?: string;
  contextType?: ActionParentEntityTypeInterface;
  moduleId?: string;
}

export interface SetFunctionPropertyPayload {
  action: JSAction;
  propertyName: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}
export interface RefactorAction {
  pageId?: string;
  actionId: string;
  newName: string;
  oldName: string;
  collectionName: string;
  moduleId?: string;
  workflowId?: string;
  contextType?: ActionParentEntityTypeInterface;
}
export interface RefactorActionRequest extends RefactorAction {
  layoutId?: string;
}

export interface UpdateCollectionActionNameRequest
  extends RefactorActionRequest {
  actionCollection: JSCollection;
}
class JSActionAPI extends API {
  static url = "v1/collections/actions";

  static async fetchJSCollections(
    payload: FetchActionsPayload,
  ): Promise<AxiosPromise<ApiResponse<JSCollection[]>>> {
    return API.get(JSActionAPI.url, payload);
  }

  static async createJSCollection(
    jsConfig: CreateJSCollectionRequest,
  ): Promise<AxiosPromise<JSCollectionCreateUpdateResponse>> {
    const payload = {
      ...jsConfig,
      actions:
        jsConfig.actions?.map((action) => ({
          ...action,
          entityReferenceType: undefined,
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          datasource: (action as any).datasource && {
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(action as any).datasource,
            isValid: undefined,
            new: undefined,
          },
        })) ?? undefined,
    };
    return API.post(JSActionAPI.url, payload);
  }

  static async copyJSCollection(
    jsConfig: Partial<JSCollection>,
  ): Promise<AxiosPromise<JSCollectionCreateUpdateResponse>> {
    const payload = {
      ...jsConfig,
      actions:
        jsConfig.actions?.map((action) => ({
          ...action,
          entityReferenceType: undefined,
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          datasource: (action as any).datasource && {
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(action as any).datasource,
            isValid: undefined,
            new: undefined,
          },
        })) ?? undefined,
    };
    return API.post(JSActionAPI.url, payload);
  }

  static async updateJSCollectionBody(
    jsCollectionId: string,
    jsCollectionBody: string,
  ): Promise<AxiosPromise<JSCollectionCreateUpdateResponse>> {
    return API.put(`${JSActionAPI.url}/${jsCollectionId}/body`, {
      body: jsCollectionBody,
    });
  }

  static async updateJSCollection(
    jsConfig: JSCollection,
  ): Promise<AxiosPromise<JSCollectionCreateUpdateResponse>> {
    const payload = {
      ...jsConfig,
      actions:
        jsConfig.actions?.map((action) => ({
          ...action,
          entityReferenceType: undefined,
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          datasource: (action as any).datasource && {
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(action as any).datasource,
            isValid: undefined,
            new: undefined,
          },
        })) ?? undefined,
    };
    return API.put(`${JSActionAPI.url}/${jsConfig.id}`, payload);
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
    const payload = {
      ...updateJSCollectionActionName,
      actionCollection: updateJSCollectionActionName.actionCollection && {
        ...updateJSCollectionActionName.actionCollection,
        actions:
          updateJSCollectionActionName.actionCollection.actions?.map(
            (action) => ({
              ...action,
              entityReferenceType: undefined,
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              datasource: (action as any).datasource && {
                // TODO: Fix this the next time the file is edited
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...(action as any).datasource,
                isValid: undefined,
                new: undefined,
              },
            }),
          ) ?? undefined,
      },
    };
    return API.put(JSActionAPI.url + "/refactorAction", payload);
  }
}

export default JSActionAPI;
