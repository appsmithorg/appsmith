import { unsafeFunctionForEval } from "utils/DynamicBindingUtils";
import interceptAndOverrideHttpRequest from "../HTTPRequestOverride";
import { resetJSLibraries } from "../../common/JSLibrary";
import setupDOM from "../SetupDOM";
import overrideTimeout from "../TimeoutOverride";
import { EvalWorkerSyncRequest } from "../types";
import userLogs from "../UserLog";
import { addPlatformFunctionsToEvalContext } from "@appsmith/workers/Evaluation/Actions";
import initLocalStorage from "../fns/LocalStorage";

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
  setupDOM();
  addPlatformFunctionsToEvalContext(self);
  initLocalStorage(self);
  return true;
}

export function setEvaluationVersion(request: EvalWorkerSyncRequest) {
  const { data } = request;
  const { version } = data;
  self.evaluationVersion = version || 1;
  // TODO: Move this to setup
  resetJSLibraries();
  return true;
}
