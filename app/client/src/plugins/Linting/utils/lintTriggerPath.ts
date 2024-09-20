import { getDynamicBindings } from "utils/DynamicBindingUtils";
import {
  EvaluationScriptType,
  getScriptToEval,
} from "workers/Evaluation/evaluate";
import type { lintTriggerPathProps } from "../types";
import getLintingErrors from "./getLintingErrors";

export default function lintTriggerPath({
  entity,
  globalData,
  userScript,
  webworkerTelemetry,
}: lintTriggerPathProps) {
  const { jsSnippets } = getDynamicBindings(userScript, entity);
  const script = getScriptToEval(jsSnippets[0], EvaluationScriptType.TRIGGERS);

  return getLintingErrors({
    script,
    data: globalData,
    originalBinding: jsSnippets[0],
    scriptType: EvaluationScriptType.TRIGGERS,
    webworkerTelemetry,
  });
}
