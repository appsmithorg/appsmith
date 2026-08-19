import {
  getDynamicBindings,
  isEmptyTriggerValue,
} from "utils/DynamicBindingUtils";
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
  const snippet = jsSnippets[0];

  // Empty leftover events must not be wrapped as `const $$result = ;`.
  if (isEmptyTriggerValue(snippet)) {
    return [];
  }

  const script = getScriptToEval(snippet, EvaluationScriptType.TRIGGERS);

  return getLintingErrors({
    script,
    data: globalData,
    originalBinding: snippet,
    scriptType: EvaluationScriptType.TRIGGERS,
    webworkerTelemetry,
  });
}
