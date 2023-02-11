import { unsafeFunctionForEval } from "utils/DynamicBindingUtils";
import interceptAndOverrideHttpRequest from "../HTTPRequestOverride";
import setupDOM from "../SetupDOM";
import overrideTimeout from "../TimeoutOverride";
import { EvalWorkerSyncRequest } from "../types";
import userLogs from "../UserLog";
import { addPlatformFunctionsToEvalContext } from "@appsmith/workers/Evaluation/Actions";
import initLocalStorage from "../fns/LocalStorage";

export default function() {
  ///// Remove all unsafe functions
  unsafeFunctionForEval.forEach((func) => {
    // @ts-expect-error: Types are not available
    self[func] = undefined;
  });
  userLogs.overrideConsoleAPI();
  overrideTimeout();
  interceptAndOverrideHttpRequest();
  setupDOM();
  addPlatformFunctionsToEvalContext(self);
  initLocalStorage(self);
  return true;
}

export function setEvaluationVersion(request: EvalWorkerSyncRequest) {
  const { data } = request;
  const { version } = data;
  self.evaluationVersion = version || 1;
  return true;
}
