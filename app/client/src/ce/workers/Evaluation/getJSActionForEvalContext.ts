import type { JSActionEntity } from "@appsmith/entities/DataTree/types";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import JSObjectCollection from "workers/Evaluation/JSObject/Collection";
import { jsObjectFunctionFactory } from "workers/Evaluation/fns/utils/jsObjectFnFactory";

function getJSFunctionsForEntity({
  jsObject,
  jsObjectName,
}: {
  jsObjectName: string;
  jsObject: JSActionEntity;
}) {
  const jsObjectFunction: Record<string, any> = {};
  const resolvedFunctions = JSObjectCollection.getResolvedFunctions();
  const resolvedObject = Object.assign({}, resolvedFunctions[jsObjectName]);
  for (const fnName of Object.keys(resolvedObject || {})) {
    const fn = resolvedObject[fnName];
    if (typeof fn !== "function") continue;
    const data = jsObject[fnName]?.data;
    jsObjectFunction[fnName] = jsObjectFunctionFactory(
      fn,
      jsObjectName + "." + fnName,
    );

    if (!!data) {
      jsObjectFunction[fnName]["data"] = data;
    }
  }
  return jsObjectFunction;
}

export function getJSActionForEvalContext(
  entityName: string,
  entity: DataTreeEntity,
) {
  const jsObjectName = entityName;
  const jsObject = entity as JSActionEntity;

  let jsObjectForEval = JSObjectCollection.getVariableState(entityName);

  const fns = getJSFunctionsForEntity({
    jsObjectName,
    jsObject,
  });

  if (!jsObjectForEval) {
    return Object.assign({}, jsObject, fns);
  }

  jsObjectForEval =
    JSObjectCollection.getVariablesForEvaluationContext(entityName);
  return Object.assign(jsObjectForEval, fns);
}
