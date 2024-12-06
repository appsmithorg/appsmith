import Api from "api/Api";
import { GIT_BASE_URL } from "./constants";
import type { AxiosResponse } from "axios";
import type { ToggleAutocommitResponse } from "./toggleAutocommitRequest.types";

export default async function toggleAutocommitRequest(
  baseApplicationId: string,
): Promise<AxiosResponse<ToggleAutocommitResponse>> {
  return Api.patch(
    `${GIT_BASE_URL}/auto-commit/toggle/app/${baseApplicationId}`,
  );
}
