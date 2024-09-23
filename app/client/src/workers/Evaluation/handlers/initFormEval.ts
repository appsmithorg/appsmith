import { setFormEvaluationSaga } from "../formEval";
import type { EvalWorkerSyncRequest } from "../types";

export default function (request: EvalWorkerSyncRequest) {
  const { data } = request;
  const { currentEvalState, payload, type } = data;
  const response = setFormEvaluationSaga(type, payload, currentEvalState);

  return response;
}
