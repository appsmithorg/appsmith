import { validateWidgetProperty } from "workers/common/DataTreeEvaluator/validationUtils";
import { removeFunctions } from "ee/workers/Evaluation/evaluationUtils";
import type { EvalWorkerSyncRequest } from "../types";

export default function (request: EvalWorkerSyncRequest) {
  const { data } = request;
  const { property, props, validation, value } = data;
  return removeFunctions(
    validateWidgetProperty(validation, value, props, property),
  );
}
