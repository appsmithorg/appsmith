import type { ApiResponse } from "api/types";
import type { ApplicationPayload } from "entities/Application";

export interface DisconnectResponseData extends ApplicationPayload {}

export type DisconnectResponse = ApiResponse<DisconnectResponseData>;
