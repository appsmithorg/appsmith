import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { FetchAutocommitProgressResponse } from "./fetchAutocommitProgressRequest.types";

export default async function fetchAutocommitProgressRequest(
  baseApplicationId: string,
): AxiosPromise<FetchAutocommitProgressResponse> {
  return Api.get(
    `${GIT_BASE_URL}/auto-commit/progress/app/${baseApplicationId}`,
  );
}
