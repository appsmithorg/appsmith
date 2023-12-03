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
    page?: number;
    limit?: number;
  }): Promise<AxiosPromise<MockedSearchApiResponse>> {
    const { keyword, limit = 10, page = 0 } = params;
    return Api.get(
      `${SearchApi.searchURL}?keyword=${keyword}&page=${page}&size=${limit}&entities=Application,Workspace`,
    );
  }
}

export default SearchApi;
