import { DataTree, DataTreeJSAction } from "entities/DataTree/dataTreeFactory";
import { isEmpty, set } from "lodash";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";
import { JSUpdate, ParsedJSSubAction } from "utils/JSPaneUtils";
import { isTypeOfFunction, parseJSObjectWithAST } from "@shared/ast";
import DataTreeEvaluator from "workers/common/DataTreeEvaluator";
import evaluateSync, { isFunctionAsync } from "workers/Evaluation/evaluate";
import {
  DataTreeDiff,
  DataTreeDiffEvent,
  getEntityNameAndPropertyPath,
  isJSAction,
} from "workers/Evaluation/evaluationUtils";
import {
  getAppMode,
  removeFunctionsAndVariableJSCollection,
  updateJSCollectionInUnEvalTree,
} from "workers/Evaluation/JSObject/utils";
import { APP_MODE } from "entities/App";

type Actions = {
  name: string;
  body: string;
  arguments: Array<{ key: string; value: unknown }>;
  parsedFunction: any;
  isAsync: boolean;
};

type Variables = {
  name: string;
  value: string;
};

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
    Object.keys(jsUpdates).forEach((jsEntity) => {
      const entity = localUnEvalTree[jsEntity];
      const parsedBody = jsUpdates[jsEntity].parsedBody;
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
          );
        }
      }
    });
  }
  return localUnEvalTree;
};

const regex = new RegExp(/^export default[\s]*?({[\s\S]*?})/);

/**
 * Here we parse the JSObject and then determine
 * 1. it's nature : async or sync
 * 2. Find arguments of JS Actions
 * 3. set variables and actions in currentJSCollectionState and resolvedFunctions
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
  if (correctFormat) {
    const body = entity.body.replace(/export default/g, "");
    try {
      delete dataTreeEvalRef.resolvedFunctions[`${entityName}`];
      delete dataTreeEvalRef.currentJSCollectionState[`${entityName}`];
      const parseStartTime = performance.now();
      const parsedObject = parseJSObjectWithAST(body);
      const parseEndTime = performance.now();
      const JSObjectASTParseTime = parseEndTime - parseStartTime;
      dataTreeEvalRef.logs.push({
        JSObjectName: entityName,
        JSObjectASTParseTime,
      });
      const actions: Actions[] = [];
      const variables: Variables[] = [];
      if (!!parsedObject) {
        parsedObject.forEach((parsedElement) => {
          if (isTypeOfFunction(parsedElement.type)) {
            try {
              const { result } = evaluateSync(
                parsedElement.value,
                unEvalDataTree,
                {},
                false,
                undefined,
                undefined,
                true,
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

                const functionString: string = parsedElement.value;
                set(
                  dataTreeEvalRef.resolvedFunctions,
                  `${entityName}.${parsedElement.key}`,
                  result,
                );
                set(
                  dataTreeEvalRef.currentJSCollectionState,
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
              dataTreeEvalRef.currentJSCollectionState,
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
        set(jsUpdates, `${entityName}`, {
          parsedBody,
          id: entity.actionId,
        });
      } else {
        set(jsUpdates, `${entityName}`, {
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
        propertyPath: entity.name + ".body",
      },
      message: "Start object with export default",
    };
    dataTreeEvalRef.errors.push(errors);
  }
  return jsUpdates;
}

export function viewModeSaveResolvedFunctionsAndJSUpdates(
  dataTreeEvalRef: DataTreeEvaluator,
  entity: DataTreeJSAction,
  jsUpdates: Record<string, JSUpdate>,
  unEvalDataTree: DataTree,
  entityName: string,
) {
  try {
    delete dataTreeEvalRef.resolvedFunctions[`${entityName}`];
    delete dataTreeEvalRef.currentJSCollectionState[`${entityName}`];
    const jsActions = entity.meta;
    //think about adding variables as currentJSCollectionState
    Object.keys(jsActions).forEach((jsAction: string) => {
      try {
        const { result } = evaluateSync(
          jsActions[jsAction].body,
          unEvalDataTree,
          {},
          false,
          undefined,
          undefined,
          true,
        );

        if (!!result) {
          const functionString = jsActions[jsAction].body;

          set(
            dataTreeEvalRef.resolvedFunctions,
            `${entityName}.${jsAction}`,
            result,
          );
          set(
            dataTreeEvalRef.currentJSCollectionState,
            `${entityName}.${jsAction}`,
            functionString,
          );
        }
      } catch {
        // in case we need to handle error state
      }
    });
  } catch (e) {
    //if we need to push error as popup in case
  }
  return jsUpdates;
}

export function parseJSActions(
  dataTreeEvalRef: DataTreeEvaluator,
  unEvalDataTree: DataTree,
  differences?: DataTreeDiff[],
  oldUnEvalTree?: DataTree,
) {
  let jsUpdates: Record<string, JSUpdate> = {};
  const isViewMode = getAppMode(unEvalDataTree) === APP_MODE.PUBLISHED;
  if (isViewMode) {
    Object.keys(unEvalDataTree).forEach((entityName) => {
      const entity = unEvalDataTree[entityName];
      if (!isJSAction(entity)) {
        return;
      }
      jsUpdates = viewModeSaveResolvedFunctionsAndJSUpdates(
        dataTreeEvalRef,
        entity,
        jsUpdates,
        unEvalDataTree,
        entityName,
      );
    });
  } else {
    if (!!differences && !!oldUnEvalTree) {
      differences.forEach((diff) => {
        const { entityName, propertyPath } = getEntityNameAndPropertyPath(
          diff.payload.propertyPath,
        );
        const entity = unEvalDataTree[entityName];

        if (!isJSAction(entity)) {
          return false;
        }

        switch (diff.event) {
          case DataTreeDiffEvent.DELETE:
            // when JSObject is deleted, we remove it from currentJSCollectionState & resolvedFunctions
            const payLoadPropertyPath = diff.payload.propertyPath;
            if (
              dataTreeEvalRef.currentJSCollectionState &&
              dataTreeEvalRef.currentJSCollectionState[payLoadPropertyPath]
            ) {
              delete dataTreeEvalRef.currentJSCollectionState[
                payLoadPropertyPath
              ];
            }
            if (
              dataTreeEvalRef.resolvedFunctions &&
              dataTreeEvalRef.resolvedFunctions[payLoadPropertyPath]
            ) {
              delete dataTreeEvalRef.resolvedFunctions[payLoadPropertyPath];
            }
            break;
          case DataTreeDiffEvent.EDIT:
            if (propertyPath === "body") {
              jsUpdates = saveResolvedFunctionsAndJSUpdates(
                dataTreeEvalRef,
                entity,
                jsUpdates,
                unEvalDataTree,
                entityName,
              );
            }
            break;
          case DataTreeDiffEvent.NEW:
            if (propertyPath === "") {
              jsUpdates = saveResolvedFunctionsAndJSUpdates(
                dataTreeEvalRef,
                entity,
                jsUpdates,
                unEvalDataTree,
                entityName,
              );
            }
            break;
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

    Object.keys(jsUpdates).forEach((entityName) => {
      const parsedBody = jsUpdates[entityName].parsedBody;
      if (!parsedBody) return;
      parsedBody.actions = parsedBody.actions.map((action) => {
        return {
          ...action,
          isAsync: isFunctionAsync(
            action.parsedFunction,
            unEvalDataTree,
            dataTreeEvalRef.resolvedFunctions,
            dataTreeEvalRef.logs,
          ),
          // parsedFunction - used only to determine if function is async
          parsedFunction: undefined,
        } as ParsedJSSubAction;
      });
    });
  }
  return { jsUpdates };
}

export function getJSEntities(dataTree: DataTree) {
  const jsCollections: Record<string, DataTreeJSAction> = {};
  Object.keys(dataTree).forEach((key: string) => {
    const entity = dataTree[key];
    if (isJSAction(entity)) {
      jsCollections[entity.name] = entity;
    }
  });
  return jsCollections;
}
