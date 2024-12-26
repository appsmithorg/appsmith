import type { ApiResponse } from "api/types";

export type ToggleAutocommitResponseData = boolean;

export type ToggleAutocommitResponse =
  ApiResponse<ToggleAutocommitResponseData>;
