import { unsafeFunctionForEval } from "utils/DynamicBindingUtils";
import interceptAndOverrideHttpRequest from "../HTTPRequestOverride";
import { resetJSLibraries } from "../../common/JSLibrary";
import SetupDOM from "../SetupDOM";
import overrideTimeout from "../TimeoutOverride";
import { EvalWorkerRequest } from "../types";
import userLogs from "../UserLog";

export default function() {
  const libraries = resetJSLibraries();
  ///// Adding extra libraries separately
  libraries.forEach((library) => {
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
  // TODO: Move this to setup
  resetJSLibraries();
  return true;
}
