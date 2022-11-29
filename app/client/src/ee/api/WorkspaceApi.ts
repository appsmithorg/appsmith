export * from "ce/api/WorkspaceApi";
import Api from "api/Api";
import { ApiResponse } from "api/ApiResponses";
import { AxiosPromise } from "axios";
import { default as CE_WorkspaceApi } from "ce/api/WorkspaceApi";

class WorkspaceApi extends CE_WorkspaceApi {
  static fetchGroupSuggestionsURL = "/v1/user-groups/for-invite";

  static fetchGroupSuggestions(): AxiosPromise<ApiResponse> {
    return Api.get(WorkspaceApi.fetchGroupSuggestionsURL);
  }
}

export default WorkspaceApi;
