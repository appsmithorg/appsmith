import { unsafeFunctionForEval } from "utils/DynamicBindingUtils";
import initFetch from "../fns/overrides/fetch";
import setupDOM from "../SetupDOM";
import initTimeoutFns from "../fns/overrides/timeout";
import { EvalWorkerSyncRequest } from "../types";
import userLogs from "../fns/overrides/console";
import { addPlatformFunctionsToEvalContext } from "@appsmith/workers/Evaluation/Actions";
import initLocalStorage from "../fns/overrides/localStorage";

export default function() {
  ///// Remove all unsafe functions
  unsafeFunctionForEval.forEach((func) => {
    // @ts-expect-error: Types are not available
    self[func] = undefined;
  });
  userLogs.overrideConsoleAPI();
  initTimeoutFns();
  initFetch();
  setupDOM();
  addPlatformFunctionsToEvalContext(self);
  initLocalStorage.call(self);
  return true;
}

export function setEvaluationVersion(request: EvalWorkerSyncRequest) {
  const { data } = request;
  const { version } = data;
  self.evaluationVersion = version || 1;
  return true;
}
