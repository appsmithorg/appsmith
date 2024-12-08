import type { AutocommitStatus } from "../constants/enums";

export interface TriggerAutocommitResponse {
  autoCommitResponse: AutocommitStatus;
  progress: number;
  branchName: string;
}
