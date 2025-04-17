import type { EvalTreeResponseData } from "workers/Evaluation/types";

export interface UpdateDataTreeMessageData {
  workerResponse: EvalTreeResponseData;
}
