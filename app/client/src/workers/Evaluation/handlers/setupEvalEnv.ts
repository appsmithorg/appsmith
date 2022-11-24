import { JSLibraries, unsafeFunctionForEval } from "utils/DynamicBindingUtils";
import interceptAndOverrideHttpRequest from "../HTTPRequestOverride";
import { resetJSLibraries } from "../JSLibrary";
import SetupDOM from "../SetupDOM";
import overrideTimeout from "../TimeoutOverride";
import { EvalWorkerRequest } from "../types";
import userLogs from "../UserLog";

export default function() {
  resetJSLibraries();
  ///// Adding extra libraries separately
  JSLibraries.forEach((library) => {
    // @ts-expect-error: Types are not available
    self[library.accessor] = library.lib;
  });

  ///// Remove all unsafe functions
  unsafeFunctionForEval.forEach((func) => {
    // @ts-expect-error: Types are not available
    self[func] = undefined;
  });
  self.window = self;
  userLogs.overrideConsoleAPI();
  overrideTimeout();
  interceptAndOverrideHttpRequest();
  SetupDOM();
  return true;
}

export function setEvaluationVersion(request: EvalWorkerRequest) {
  const { requestData } = request;
  const { version } = requestData;
  self.evaluationVersion = version || 1;
  return true;
}
