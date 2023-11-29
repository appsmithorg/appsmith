import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";
import type { FetchApplicationsResponse } from "./ApplicationApi";
import type { FetchWorkspacesResponse } from "./WorkspaceApi";

export interface SearchEntitiesRequest {
  entities: string[];
  keyword: string;
  page: number;
  limit: number;
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

  static async searchAllEntities() {
    // keyword: string,
    // : Promise<AxiosPromise<SearchEntitiesResponse>> {
    // const request: SearchEntitiesRequest = {
    //   keyword,
    //   entities: ["workspaces", "applications", "packages"],
    //   page: 1,
    //   limit: 100,
    // };
    // return new Promise();
  }
}

export default SearchApi;
