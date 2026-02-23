import type { ApiResponse } from "api/types";
import type { ApplicationPayload } from "entities/Application";

export interface ConnectRequestParams {
  remoteUrl: string;
  gitProfile?: {
    authorName: string;
    authorEmail: string;
    useDefaultProfile?: boolean;
  };
  /**
   * Optional ID of an existing SSH key to use for this connection.
   * If provided, the server will use this key instead of the artifact's generated key.
   * The key must be owned by or shared with the current user.
   */
  sshKeyId?: string;
}

export interface ConnectResponseData extends ApplicationPayload {}

export type ConnectResponse = ApiResponse<ConnectResponseData>;
