import type { ApiResponse } from "api/types";
import type { AutocommitStatus } from "../constants/enums";

export interface TriggerAutocommitResponseData {
  autoCommitResponse: keyof typeof AutocommitStatus;
  progress: number;
  branchName: string;
}

export type TriggerAutocommitResponse =
  ApiResponse<TriggerAutocommitResponseData>;
