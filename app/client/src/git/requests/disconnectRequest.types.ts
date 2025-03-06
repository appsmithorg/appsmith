import type { ApiResponse } from "api/types";
import type { GitArtifact } from "git/types";

export type DisconnectResponseData = GitArtifact;

export type DisconnectResponse = ApiResponse<DisconnectResponseData>;
