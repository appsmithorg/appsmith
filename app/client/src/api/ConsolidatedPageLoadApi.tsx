import Api from "./Api";
import type { AxiosPromise } from "axios";
import type { ApiResponse } from "api/ApiResponses";

import type { APP_MODE } from "entities/App";
import type { InitConsolidatedApi } from "sagas/InitSagas";

class ConsolidatedPageLoadApi extends Api {
  static url = "/v1/consolidated-api";

  static async getConsolidatedPageLoadData(params: {
    applicationId?: string;
    defaultPageId?: string;
    mode?: APP_MODE;
  }): Promise<AxiosPromise<ApiResponse<InitConsolidatedApi>>> {
    return Api.get(ConsolidatedPageLoadApi.url, params);
  }
}

export default ConsolidatedPageLoadApi;
