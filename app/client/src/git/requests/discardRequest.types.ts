import type { ApiResponse } from "api/types";
import type { GitArtifact } from "git/store/types";

export type DiscardResponseData = GitArtifact;

export type DiscardResponse = ApiResponse<DiscardResponseData>;
