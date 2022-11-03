export enum AppsmithWorkers {
  LINT_WORKER = "LINT_WORKER",
  EVALUATION_WORKER = "EVALUATION_WORKER",
  SETUP_WORKER = "SETUP_WORKER",
}
export enum WorkerErrorTypes {
  CLONE_ERROR = "CLONE_ERROR",
}

export interface WorkerRequest<TData, TActions> {
  method: TActions;
  requestData: TData;
  requestId: string;
}
