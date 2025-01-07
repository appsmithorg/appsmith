import type { ApiResponse } from "api/types";
import type { ApplicationPayload } from "entities/Application";

export interface ConnectRequestParams {
  remoteUrl: string;
  gitProfile?: {
    authorName: string;
    authorEmail: string;
    useDefaultProfile?: boolean;
  };
}

export interface ConnectResponseData extends ApplicationPayload {}

export type ConnectResponse = ApiResponse<ConnectResponseData>;
