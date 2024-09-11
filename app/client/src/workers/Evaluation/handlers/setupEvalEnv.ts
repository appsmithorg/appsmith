import { unsafeFunctionForEval } from "utils/DynamicBindingUtils";
import setupDOM from "../SetupDOM";
import type { EvalWorkerSyncRequest } from "../types";
import { addPlatformFunctionsToEvalContext } from "ee/workers/Evaluation/Actions";
import { overrideWebAPIs } from "../fns/overrides";
import { WorkerEnv } from "./workerEnv";

export default function (request: EvalWorkerSyncRequest) {
  self.$isDataField = false;
  ///// Remove all unsafe functions
  unsafeFunctionForEval.forEach((func) => {
    // @ts-expect-error: Types are not available
    self[func] = undefined;
  });
  setupDOM();
  overrideWebAPIs(self);

  WorkerEnv.setFeatureFlags(request.data.featureFlags);
  WorkerEnv.setCloudHosting(request.data.cloudHosting);
  addPlatformFunctionsToEvalContext(self);
  return true;
}

export function setEvaluationVersion(request: EvalWorkerSyncRequest) {
  const { data } = request;
  const { version } = data;
  self.evaluationVersion = version || 1;
  return true;
}
