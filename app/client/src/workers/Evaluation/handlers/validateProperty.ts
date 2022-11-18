import { validateWidgetProperty } from "workers/common/DataTreeEvaluator/validationUtils";
import { removeFunctions } from "../evaluationUtils";
import { EvalWorkerRequest } from "../types";

export default function(request: EvalWorkerRequest) {
  const { requestData } = request;
  const { property, props, validation, value } = requestData;
  return removeFunctions(
    validateWidgetProperty(validation, value, props, property),
  );
}
