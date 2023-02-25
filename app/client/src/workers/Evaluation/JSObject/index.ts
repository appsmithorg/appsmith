import { DataTree, DataTreeJSAction } from "entities/DataTree/dataTreeFactory";
import { get, isEmpty, merge, set } from "lodash";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";
import { JSUpdate, ParsedJSSubAction } from "utils/JSPaneUtils";
import { isTypeOfFunction, parseJSObjectWithAST } from "@shared/ast";
import DataTreeEvaluator from "workers/common/DataTreeEvaluator";
import evaluateSync from "workers/Evaluation/evaluate";
import {
  DataTreeDiff,
  DataTreeDiffEvent,
  getEntityNameAndPropertyPath,
  isJSAction,
  isJSObject,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  removeFunctionsAndVariableJSCollection,
  updateJSCollectionInUnEvalTree,
} from "workers/Evaluation/JSObject/utils";
import { functionDeterminer } from "../functionDeterminer";
import { dataTreeEvaluator } from "../handlers/evalTree";
import { getOriginalValueFromProxy, jsObjectCollection } from "./Collection";
import { klona } from "klona/full";

/**
 * Here we update our unEvalTree according to the change in JSObject's body
 *
 * @param jsUpdates
 * @param localUnEvalTree
 * @returns
 */
export const getUpdatedLocalUnEvalTreeAfterJSUpdates = (
  jsUpdates: Record<string, JSUpdate>,
  localUnEvalTree: DataTree,
) => {
  if (!isEmpty(jsUpdates)) {
    Object.keys(jsUpdates).forEach((jsEntityName) => {
      const entity = localUnEvalTree[jsEntityName];
      const parsedBody = jsUpdates[jsEntityName].parsedBody;
      if (isJSAction(entity)) {
        if (!!parsedBody) {
          //add/delete/update functions from dataTree
          localUnEvalTree = updateJSCollectionInUnEvalTree(
            parsedBody,
            entity,
            localUnEvalTree,
          );
        } else {
          //if parse error remove functions and variables from dataTree
          localUnEvalTree = removeFunctionsAndVariableJSCollection(
            localUnEvalTree,
            entity,
            jsEntityName,
          );
        }
      }
    });
  }
  return localUnEvalTree;
};

export const updateUnEvalTreeWithChanges = (
  updatedValuePaths: string[][],
  UnEvalTree: DataTree,
) => {
  for (const path of updatedValuePaths) {
    if (path?.length) {
      const entityName = path[0];
      const entity = UnEvalTree[entityName];
      if (isJSAction(entity)) {
        const variableName = path[1];
        const fullPath = `${entityName}.${variableName}`;
        const newJSObject = jsObjectCollection.getCurrentVariableState(
          entityName,
        );
        const latestValue = newJSObject[variableName];
        set(UnEvalTree, fullPath, latestValue);
      }
    }
  }

  return UnEvalTree;
};

const regex = new RegExp(/^export default[\s]*?({[\s\S]*?})/);

/**
 * Here we parse the JSObject and then determine
 * 1. it's nature : async or sync
 * 2. Find arguments of JS Actions
 *
 * @param dataTreeEvalRef
 * @param entity
 * @param jsUpdates
 * @param unEvalDataTree
 * @param entityName
 * @returns
 */
export function saveResolvedFunctionsAndJSUpdates(
  dataTreeEvalRef: DataTreeEvaluator,
  entity: DataTreeJSAction,
  jsUpdates: Record<string, JSUpdate>,
  unEvalDataTree: DataTree,
  entityName: string,
) {
  const correctFormat = regex.test(entity.body);

  const resolvedFunctions = jsObjectCollection.getResolvedFunctions();
  const unEvalJSCollection = jsObjectCollection.getUnEvalState();

  if (correctFormat) {
    const body = entity.body.replace(/export default/g, "");
    try {
      delete unEvalJSCollection[entityName];
      delete resolvedFunctions[entityName];
      const parseStartTime = performance.now();
      const parsedObject = parseJSObjectWithAST(body);
      const parseEndTime = performance.now();
      const JSObjectASTParseTime = parseEndTime - parseStartTime;
      dataTreeEvalRef.logs.push({
        JSObjectName: entityName,
        JSObjectASTParseTime,
      });
      const actions: any = [];
      const variables: any = [];
      if (!!parsedObject) {
        parsedObject.forEach((parsedElement) => {
          if (isTypeOfFunction(parsedElement.type)) {
            try {
              const { result } = evaluateSync(
                parsedElement.value,
                unEvalDataTree,
                false,
                undefined,
                undefined,
              );
              if (!!result) {
                let params: Array<{ key: string; value: unknown }> = [];

                if (parsedElement.arguments) {
                  params = parsedElement.arguments.map(
                    ({ defaultValue, paramName }) => ({
                      key: paramName,
                      value: defaultValue,
                    }),
                  );
                }

                const functionString = parsedElement.value;
                set(
                  resolvedFunctions,
                  `${entityName}.${parsedElement.key}`,
                  result,
                );
                set(
                  unEvalJSCollection,
                  `${entityName}.${parsedElement.key}`,
                  functionString,
                );
                actions.push({
                  name: parsedElement.key,
                  body: functionString,
                  arguments: params,
                  parsedFunction: result,
                  isAsync: false,
                });
              }
            } catch {
              // in case we need to handle error state
            }
          } else if (parsedElement.type !== "literal") {
            variables.push({
              name: parsedElement.key,
              value: parsedElement.value,
            });
            set(
              unEvalJSCollection,
              `${entityName}.${parsedElement.key}`,
              parsedElement.value,
            );
          }
        });
        const parsedBody = {
          body: entity.body,
          actions: actions,
          variables,
        };
        set(jsUpdates, entityName, {
          parsedBody,
          id: entity.actionId,
        });
      } else {
        set(jsUpdates, entityName, {
          parsedBody: undefined,
          id: entity.actionId,
        });
      }
    } catch (e) {
      //if we need to push error as popup in case
    }
  } else {
    const errors = {
      type: EvalErrorTypes.PARSE_JS_ERROR,
      context: {
        entity: entity,
        propertyPath: entityName + ".body",
      },
      message: "Start object with export default",
    };
    dataTreeEvalRef.errors.push(errors);
  }
  return jsUpdates;
}

export function parseJSActions(
  dataTreeEvalRef: DataTreeEvaluator,
  unEvalDataTree: DataTree,
  differences?: DataTreeDiff[],
  oldUnEvalTree?: DataTree,
) {
  const resolvedFunctions = jsObjectCollection.getResolvedFunctions();
  const unEvalJSCollection = jsObjectCollection.getUnEvalState();
  let jsUpdates: Record<string, JSUpdate> = {};
  if (!!differences && !!oldUnEvalTree) {
    differences.forEach((diff) => {
      const { entityName, propertyPath } = getEntityNameAndPropertyPath(
        diff.payload.propertyPath,
      );
      const entity = unEvalDataTree[entityName];

      if (!isJSAction(entity)) return false;

      if (diff.event === DataTreeDiffEvent.DELETE) {
        // when JSObject is deleted, we remove it from currentJSCollectionState & resolvedFunctions
        if (
          unEvalJSCollection &&
          unEvalJSCollection[diff.payload.propertyPath]
        ) {
          delete unEvalJSCollection[diff.payload.propertyPath];
        }
        if (resolvedFunctions && resolvedFunctions[diff.payload.propertyPath]) {
          delete resolvedFunctions[diff.payload.propertyPath];
        }
      }

      if (
        (diff.event === DataTreeDiffEvent.EDIT && propertyPath === "body") ||
        (diff.event === DataTreeDiffEvent.NEW && propertyPath === "")
      ) {
        jsUpdates = saveResolvedFunctionsAndJSUpdates(
          dataTreeEvalRef,
          entity,
          jsUpdates,
          unEvalDataTree,
          entityName,
        );
      }
    });
  } else {
    Object.keys(unEvalDataTree).forEach((entityName) => {
      const entity = unEvalDataTree[entityName];
      if (!isJSAction(entity)) {
        return;
      }
      jsUpdates = saveResolvedFunctionsAndJSUpdates(
        dataTreeEvalRef,
        entity,
        jsUpdates,
        unEvalDataTree,
        entityName,
      );
    });
  }

  functionDeterminer.setupEval(unEvalDataTree);

  Object.keys(jsUpdates).forEach((entityName) => {
    const parsedBody = jsUpdates[entityName].parsedBody;
    if (!parsedBody) return;
    parsedBody.actions = parsedBody.actions.map((action) => {
      return {
        ...action,
        isAsync: functionDeterminer.isFunctionAsync(
          action.parsedFunction,
          dataTreeEvalRef.logs,
        ),
        // parsedFunction - used only to determine if function is async
        parsedFunction: undefined,
      } as ParsedJSSubAction;
    });
  });

  functionDeterminer.close();

  return { jsUpdates };
}

export function getJSEntities(dataTree: DataTree) {
  const jsCollections: Record<string, DataTreeJSAction> = {};
  Object.keys(dataTree).forEach((entityName: string) => {
    const entity = dataTree[entityName];
    if (isJSAction(entity)) {
      jsCollections[entityName] = entity;
    }
  });
  return jsCollections;
}

export function updateJSCollectionStateFromContext() {
  const newVarState = {};
  const currentEvalContext = self;

  const unEvalJSCollection = jsObjectCollection.getUnEvalState();
  const oldUnEvalTree = dataTreeEvaluator?.oldUnEvalTree || {};
  const jsObjectNames = Object.keys(unEvalJSCollection || {});
  for (const jsObjectName of jsObjectNames) {
    const jsObjectEntity = oldUnEvalTree[jsObjectName] as DataTreeJSAction;
    if (isJSObject(jsObjectEntity)) {
      const variables = jsObjectEntity.variables;
      for (const variableName of variables) {
        const variableValue = get(currentEvalContext, [
          jsObjectName,
          variableName,
        ]);
        set(
          newVarState,
          [jsObjectName, variableName],
          getOriginalValueFromProxy(variableValue),
        );
      }
    }
  }
  jsObjectCollection.setVariableState(newVarState);
}

export function removeProxyObject(objOrArr: any) {
  const newObjOrArr: any = getOriginalValueFromProxy(objOrArr);
  if (typeof objOrArr === "object") {
    for (const key in objOrArr) {
      newObjOrArr[key] = removeProxyObject(objOrArr[key]);
    }
  }
  return newObjOrArr;
}

export function updateEvalTreeWithJSCollectionState(evalTree: DataTree) {
  // loop through jsCollectionState and set all values to evalTree
  const jsCollections = jsObjectCollection.getCurrentVariableState();
  const jsCollectionEntries = Object.entries(jsCollections);
  for (const [jsObjectName, variableState] of jsCollectionEntries) {
    const sanitizedState = removeProxyObject(variableState);
    const newJSObject = merge(evalTree[jsObjectName], sanitizedState);
    evalTree[jsObjectName] = newJSObject;
  }
}

export function updateEvalTreeValueFromContext(paths: string[][]) {
  const currentEvalContext = self;

  const oldUnEvalTree = dataTreeEvaluator?.oldUnEvalTree || {};
  const evalTree = dataTreeEvaluator?.evalTree;

  if (!evalTree) return;

  for (const fullPathArray of paths) {
    const [jsObjectName, variableName] = fullPathArray;
    const entity = oldUnEvalTree[jsObjectName] as DataTreeJSAction;
    if (jsObjectName && variableName && isJSObject(entity)) {
      const variableValue = get(currentEvalContext, [
        jsObjectName,
        variableName,
      ]);
      const value = klona(removeProxyObject(variableValue));
      jsObjectCollection.setVariableValue(
        value,
        `${jsObjectName}.${variableName}`,
      );
    }
  }
}
