import type { DataTree } from "entities/DataTree/dataTreeFactory";
import type { LintError } from "utils/DynamicBindingUtils";
import { getScriptType } from "workers/Evaluation/evaluate";
import type { JSActionEntity } from "entities/DataTree/types";
import getLintingErrors from "./getLintingErrors";

export default function lintJSObjectBody(
  jsObjectName: string,
  globalData: DataTree,
): LintError[] {
  const jsObject = globalData[jsObjectName];
  const rawJSObjectbody = (jsObject as unknown as JSActionEntity).body;
  if (!rawJSObjectbody) return [];
  const scriptType = getScriptType(false, false);
  return getLintingErrors({
    script: rawJSObjectbody,
    data: globalData,
    originalBinding: rawJSObjectbody,
    scriptType,
  });
}
