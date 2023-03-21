import type {
  DataTreeEntity,
  DataTreeJSAction,
} from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";

import JSObjectCollection from "./JSObject/Collection";
import JSProxy from "./JSObject/JSVariableProxy";
import { jsObjectFunctionFactory } from "./fns/utils/jsObjectFnFactory";

function getJSFunctionsForEntity({
  enableJSFnPostProcessors,
  jsObject,
  jsObjectName,
}: {
  jsObjectName: string;
  jsObject: DataTreeJSAction;
  enableJSFnPostProcessors: boolean;
}) {
  const jsObjectFunction: Record<string, any> = {};
  const resolvedFunctions = JSObjectCollection.getResolvedFunctions();
  const resolvedObject = Object.assign({}, resolvedFunctions[jsObjectName]);
  for (const fnName of Object.keys(resolvedObject || {})) {
    const fn = resolvedObject[fnName];
    if (typeof fn !== "function") continue;
    const data = jsObject[fnName]?.data;
    jsObjectFunction[fnName] = enableJSFnPostProcessors
      ? jsObjectFunctionFactory(fn, jsObjectName + "." + fnName)
      : fn;
    if (!!data) {
      jsObjectFunction[fnName]["data"] = data;
    }
  }
  return jsObjectFunction;
}

export function getEntityForEvalContext(
  entity: DataTreeEntity,
  entityName: string,
  enableJSFnPostProcessors: boolean,
) {
  if (entity && "ENTITY_TYPE" in entity) {
    switch (entity.ENTITY_TYPE) {
      case ENTITY_TYPE.JSACTION: {
        const jsObjectName = entityName;
        const jsObject = entity;

        let jsObjectForEval =
          JSObjectCollection.getCurrentVariableState(entityName);

        const fns = getJSFunctionsForEntity({
          jsObjectName,
          jsObject,
          enableJSFnPostProcessors,
        });

        if (!jsObjectForEval) {
          return Object.assign({}, jsObject, fns);
        }

        if (self.$isDataField) {
          return Object.assign({}, jsObjectForEval, fns);
        }

        jsObjectForEval = JSProxy.create(entity, entityName, jsObjectForEval);
        return Object.assign(jsObjectForEval, fns);
      }
    }
  }
  return entity;
}
