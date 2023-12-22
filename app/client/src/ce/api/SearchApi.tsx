import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";
import type { FetchApplicationsResponse } from "./ApplicationApi";
import type { FetchWorkspacesResponse } from "./WorkspaceApi";
import type { AxiosPromise } from "axios";

export interface SearchEntitiesRequest {
  entities?: string[];
  keyword: string;
  page?: number;
  limit?: number;
}

export interface SearchEntitiesResponse {
  entities: [];
  keyword: string;
  page: number;
  limit: number;
}

export interface MockedSearchApiResponse extends ApiResponse {
  data: {
    applications: FetchApplicationsResponse[];
    workspaces: FetchWorkspacesResponse[];
  };
}

export class SearchApi extends Api {
  static searchURL = "v1/search-entities";

  static async searchAllEntities(params: {
    keyword: string;
    limit?: number;
  }): Promise<AxiosPromise<MockedSearchApiResponse>> {
    const { keyword, limit = 10 } = params;
    return Api.get(`${SearchApi.searchURL}?keyword=${keyword}&size=${limit}`);
  }
}

export default SearchApi;
