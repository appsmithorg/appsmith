import type { WebworkerSpanData } from "UITelemetry/generateWebWorkerTraces";
import type { SpanAttributes } from "UITelemetry/generateTraces";

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
  data: TData;
  webworkerTelemetry: Record<string, WebworkerSpanData | SpanAttributes>;
}
