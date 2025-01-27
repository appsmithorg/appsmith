import type { ApiResponse } from "api/types";
import type { GitArtifact } from "git/store/types";

export type DisconnectResponseData = GitArtifact;

export type DisconnectResponse = ApiResponse<DisconnectResponseData>;
