import type {
  DeleteModulePayload,
  SaveModulePayload,
} from "@appsmith/actions/moduleActions";
import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";
import type { AxiosPromise } from "axios";

const BASE_URL = "v1/modules";

class ModuleApi extends Api {
  static async deleteModule(
    payload: DeleteModulePayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const { id } = payload;
    const url = `${BASE_URL}/${id}`;

    return Api.delete(url);
  }

  static async saveModuleName(
    payload: SaveModulePayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const { id } = payload;
    const url = `${BASE_URL}/${id}`;

    return Api.put(url, payload);
  }
}

export default ModuleApi;
