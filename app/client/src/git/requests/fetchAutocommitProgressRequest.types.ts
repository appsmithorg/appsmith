import type { ApiResponse } from "api/types";
import type { AutocommitStatusState } from "../constants/enums";

export interface FetchAutocommitProgressResponseData {
  autoCommitResponse: AutocommitStatusState;
  progress: number;
  branchName: string;
}

export type FetchAutocommitProgressResponse =
  ApiResponse<FetchAutocommitProgressResponseData>;
