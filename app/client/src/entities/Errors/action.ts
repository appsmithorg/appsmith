import { ActionableError } from "entities/Errors";

export enum ActionError {
  EXECUTION_TIMEOUT = "action:execution:timeout",
  EXECUTION_UNKNOWN = "action:exectution:unknown",
}

export interface TimeoutError extends ActionableError {
  type: ActionError.EXECUTION_TIMEOUT;
  timeoutMs: number;
}
