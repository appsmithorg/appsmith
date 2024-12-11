import type { ApiResponse } from "api/types";
import type { AutocommitStatusState } from "../constants/enums";

export interface TriggerAutocommitResponseData {
  autoCommitResponse: keyof typeof AutocommitStatusState;
  progress: number;
  branchName: string;
}

export type TriggerAutocommitResponse =
  ApiResponse<TriggerAutocommitResponseData>;
