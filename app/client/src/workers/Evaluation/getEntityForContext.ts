import { DataTreeEntity, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import JSObjectCollection from "./JSObject/Collection";
import JSProxy from "./JSObject/JSVariableProxy";
import { jsObjectFunctionFactory } from "./fns/utils/jsObjectFnFactory";

export function getEntityForEvalContext(
  entity: DataTreeEntity,
  entityName: string,
  enableJSObjectFactory: boolean,
) {
  if (entity && "ENTITY_TYPE" in entity) {
    switch (entity.ENTITY_TYPE) {
      case ENTITY_TYPE.JSACTION: {
        const jsObjectName = entityName;
        const jsObject = entity;

        const jsObjectForEval = JSObjectCollection.getCurrentVariableState(
          entityName,
        );
        const resolvedFunctions = JSObjectCollection.getResolvedFunctions();

        const resolvedObject = resolvedFunctions[jsObjectName];

        if (!jsObjectForEval) {
          break;
        }

        for (const fnName of Object.keys(resolvedObject || {})) {
          const fn = resolvedObject[fnName];
          if (typeof fn !== "function") continue;
          // Investigate promisify of JSObject function confirmation
          // Task: https://github.com/appsmithorg/appsmith/issues/13289
          // Previous implementation commented code: https://github.com/appsmithorg/appsmith/pull/18471
          const data = jsObject[fnName]?.data;
          jsObjectForEval[fnName] = enableJSObjectFactory
            ? jsObjectFunctionFactory(fn, jsObjectName + "." + fnName)
            : fn;
          if (!!data) {
            jsObjectForEval[fnName]["data"] = data;
          }
        }

        if (self.$isDataField) {
          return jsObjectForEval;
        }

        return JSProxy.create(entity, entityName, jsObjectForEval);
      }
    }
  }
  return entity;
}
