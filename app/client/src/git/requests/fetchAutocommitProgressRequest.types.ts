import type { AutocommitStatus } from "../constants/enums";

export interface FetchAutocommitProgressResponse {
  autoCommitResponse: AutocommitStatus;
  progress: number;
  branchName: string;
}
