import type { AxiosPromise } from "axios";
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

  static async searchAllEntities() // keyword: string,
  : Promise<AxiosPromise<SearchEntitiesResponse>> {
    // const request: SearchEntitiesRequest = {
    //   keyword,
    //   entities: ["workspaces", "applications", "packages"],
    //   page: 1,
    //   limit: 100,
    // };

    // Mocked response structure based on the provided data
    const mockedResponse: MockedSearchApiResponse = {
      success: true,
      data: {},
      // Other properties in ApiResponse...
    };

    // Simulate API call delay using setTimeout (remove this in a real API call)
    return new Promise<AxiosPromise<SearchEntitiesResponse>>((resolve) => {
      setTimeout(() => {
        resolve({
          data: mockedResponse,
          // Simulated Axios response object structure
          // You might need to adjust this based on your Axios response structure
          status: 200,
          statusText: "OK",
          headers: {},
          config: {},
          request: null,
        });
      }, 1000); // Simulate a delay of 1 second (remove in actual implementation)
    });
  }
}

export default SearchApi;
