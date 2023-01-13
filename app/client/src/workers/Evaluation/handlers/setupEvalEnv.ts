import { unsafeFunctionForEval } from "utils/DynamicBindingUtils";
import initFetch from "../fns/fetch";
import { resetJSLibraries } from "../../common/JSLibrary";
import setupDOM from "../SetupDOM";
import initTimeoutFns from "../fns/timeout";
import { EvalWorkerSyncRequest } from "../types";
import userLogs from "../fns/console";
import { addPlatformFunctionsToEvalContext } from "@appsmith/workers/Evaluation/Actions";

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
  initTimeoutFns();
  initFetch();
  setupDOM();
  addPlatformFunctionsToEvalContext(self);
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
