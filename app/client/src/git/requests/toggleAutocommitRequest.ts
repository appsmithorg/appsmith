import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosPromise } from "axios";
import type { ToggleAutocommitResponse } from "./toggleAutocommitRequest.types";

export default async function toggleAutocommitRequest(
  baseApplicationId: string,
): AxiosPromise<ToggleAutocommitResponse> {
  return Api.patch(
    `${GIT_BASE_URL}/auto-commit/toggle/app/${baseApplicationId}`,
  );
}
