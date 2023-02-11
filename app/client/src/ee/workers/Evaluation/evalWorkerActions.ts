export * from "ce/workers/Evaluation/evalWorkerActions";
import { MAIN_THREAD_ACTION as CE_MAIN_THREAD_ACTION } from "ce/workers/Evaluation/evalWorkerActions";

export const MAIN_THREAD_ACTION = {
  ...CE_MAIN_THREAD_ACTION,
  LOG_JS_FUNCTION_EXECUTION: "LOG_JS_FUNCTION_EXECUTION",
};
