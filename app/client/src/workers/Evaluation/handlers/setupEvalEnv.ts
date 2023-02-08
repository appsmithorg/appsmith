import { unsafeFunctionForEval } from "utils/DynamicBindingUtils";
import setupDOM from "../SetupDOM";
import { EvalWorkerSyncRequest } from "../types";
import { addPlatformFunctionsToEvalContext } from "@appsmith/workers/Evaluation/Actions";
import { initOverrides } from "../fns/overrides";

export default function() {
  self.$isDataField = false;
  ///// Remove all unsafe functions
  unsafeFunctionForEval.forEach((func) => {
    // @ts-expect-error: Types are not available
    self[func] = undefined;
  });
  setupDOM();
  initOverrides(self);
  addPlatformFunctionsToEvalContext(self);
  return true;
}

export function setEvaluationVersion(request: EvalWorkerSyncRequest) {
  const { data } = request;
  const { version } = data;
  self.evaluationVersion = version || 1;
  return true;
}
