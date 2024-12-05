import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosResponse } from "axios";
import type { FetchAutocommitProgressResponse } from "./fetchAutocommitProgressRequest.types";

export async function fetchAutocommitProgressRequest(
  baseApplicationId: string,
): Promise<AxiosResponse<FetchAutocommitProgressResponse>> {
  return Api.get(
    `${GIT_BASE_URL}/auto-commit/progress/app/${baseApplicationId}`,
  );
}
