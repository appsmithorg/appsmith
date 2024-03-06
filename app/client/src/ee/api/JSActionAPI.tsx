export * from "ce/api/JSActionAPI";
import type { AxiosPromise } from "axios";
import API from "api/Api";
import { default as CE_JSActionAPI } from "ce/api/JSActionAPI";

class JSActionAPI extends CE_JSActionAPI {
  static async logActionExecution(payload: {
    metadata: {
      origin: string;
      viewMode: string;
      actionId: string;
      pageId: string;
      collectionId: string;
      actionName: string;
      pageName: string;
    };
    event: string;
    resourceType: string;
    resourceId: string;
  }): Promise<AxiosPromise<any>> {
    return API.post(`v1/analytics/event`, payload);
  }
}

export default JSActionAPI;
