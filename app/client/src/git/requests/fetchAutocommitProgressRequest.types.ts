import type { ApiResponse } from "api/types";
import type { AutocommitStatus } from "../constants/enums";

export interface FetchAutocommitProgressResponseData {
  autoCommitResponse: AutocommitStatus;
  progress: number;
  branchName: string;
}

export type FetchAutocommitProgressResponse =
  ApiResponse<FetchAutocommitProgressResponseData>;
