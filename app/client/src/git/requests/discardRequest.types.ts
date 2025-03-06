import type { ApiResponse } from "api/types";
import type { GitArtifact } from "git/types";

export type DiscardResponseData = GitArtifact;

export type DiscardResponse = ApiResponse<DiscardResponseData>;
