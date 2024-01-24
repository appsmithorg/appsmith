import Api from "./Api";
import type { AxiosPromise } from "axios";
import type { ApiResponse } from "api/ApiResponses";

import type { InitConsolidatedApi } from "sagas/InitSagas";

class ConsolidatedPageLoadApi extends Api {
  static url = "/v1/consolidated-api";

  static async getConsolidatedPageLoadDataView(params: {
    applicationId?: string;
    defaultPageId?: string;
  }): Promise<AxiosPromise<ApiResponse<InitConsolidatedApi>>> {
    return Api.get(ConsolidatedPageLoadApi.url + "/view", params);
  }
  static async getConsolidatedPageLoadDataEdit(params: {
    applicationId?: string;
    defaultPageId?: string;
  }): Promise<AxiosPromise<ApiResponse<InitConsolidatedApi>>> {
    return Api.get(ConsolidatedPageLoadApi.url + "/edit", params);
  }
}

export default ConsolidatedPageLoadApi;
