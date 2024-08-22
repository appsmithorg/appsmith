import type { ApiResponse } from "api/ApiResponses";
import type { AxiosPromise } from "axios";
import type { InitConsolidatedApi } from "sagas/InitSagas";

import Api from "./Api";

class ConsolidatedPageLoadApi extends Api {
  static url = "v1/consolidated-api";
  static consolidatedApiViewUrl = `${ConsolidatedPageLoadApi.url}/view`;
  static consolidatedApiEditUrl = `${ConsolidatedPageLoadApi.url}/edit`;

  static async getConsolidatedPageLoadDataView(params: {
    applicationId?: string;
    defaultPageId?: string;
  }): Promise<AxiosPromise<ApiResponse<InitConsolidatedApi>>> {
    return Api.get(ConsolidatedPageLoadApi.consolidatedApiViewUrl, params);
  }
  static async getConsolidatedPageLoadDataEdit(params: {
    applicationId?: string;
    defaultPageId?: string;
  }): Promise<AxiosPromise<ApiResponse<InitConsolidatedApi>>> {
    return Api.get(ConsolidatedPageLoadApi.consolidatedApiEditUrl, params);
  }
}

export default ConsolidatedPageLoadApi;
