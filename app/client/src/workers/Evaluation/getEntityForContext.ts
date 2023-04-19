import type { DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import JSObjectCollection from "./JSObject/Collection";
import JSFactory from "./JSObject/JSVariableFactory";
import { jsObjectFunctionFactory } from "./fns/utils/jsObjectFnFactory";
import type { JSActionEntity } from "entities/DataTree/types";

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

export function getEntityForEvalContext(
  entity: DataTreeEntity,
  entityName: string,
) {
  if (entity && "ENTITY_TYPE" in entity) {
    switch (entity.ENTITY_TYPE) {
      case ENTITY_TYPE.JSACTION: {
        const jsObjectName = entityName;
        const jsObject = entity;

        let jsObjectForEval = JSObjectCollection.getVariableState(entityName);

        const fns = getJSFunctionsForEntity({
          jsObjectName,
          jsObject,
        });

        if (!jsObjectForEval) {
          return Object.assign({}, jsObject, fns);
        }

        jsObjectForEval = JSFactory.create(entityName, jsObjectForEval);
        return Object.assign(jsObjectForEval, fns);
      }
    }
  }
  return entity;
}
