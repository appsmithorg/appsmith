import API from "api/Api";
import type { AxiosPromise } from "axios";

export interface GenerateSchemaResponse {
  description: string;
  schema: unknown;
}

export class SchemaAPI extends API {
  static url = "v1/actions";

  static async generateSchema(
    actionId: string,
  ): Promise<AxiosPromise<GenerateSchemaResponse>> {
    return API.patch(`${SchemaAPI.url}/${actionId}/schema`);
  }
}
