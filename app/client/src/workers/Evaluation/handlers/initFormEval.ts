import { setFormEvaluationSaga } from "../formEval";
import { EvalWorkerSyncRequest } from "../types";

export default function(request: EvalWorkerSyncRequest) {
  const { requestData } = request;
  const { currentEvalState, payload, type } = requestData;
  const response = setFormEvaluationSaga(type, payload, currentEvalState);
  return response;
}
