import { setFormEvaluationSaga } from "../formEval";
import { EvalWorkerRequest } from "../types";

export default function(request: EvalWorkerRequest) {
  const { requestData } = request;
  const { currentEvalState, payload, type } = requestData;
  const response = setFormEvaluationSaga(type, payload, currentEvalState);
  return response;
}
