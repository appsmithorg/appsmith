import { DataTree, DataTreeJSAction } from "entities/DataTree/dataTreeFactory";
import { isEmpty, set } from "lodash";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";
import { JSUpdate, ParsedJSSubAction } from "utils/JSPaneUtils";
import { isTypeOfFunction, parseJSObjectWithAST } from "@shared/ast";
import DataTreeEvaluator from "workers/DataTreeEvaluator";
import evaluate, { isFunctionAsync } from "workers/evaluate";
import {
  DataTreeDiff,
  DataTreeDiffEvent,
  getEntityNameAndPropertyPath,
  isJSAction,
} from "workers/evaluationUtils";
import {
  removeFunctionsAndVariableJSCollection,
  updateJSCollectionInUnEvalTree,
} from "workers/JSObject/utils";

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
  if (isEmpty(jsUpdates)) return localUnEvalTree;

  for (const jsEntity of Object.keys(jsUpdates)) {
    const entity = localUnEvalTree[jsEntity];
    const parsedBody = jsUpdates[jsEntity].parsedBody;
    if (!isJSAction(entity)) continue;
    if (parsedBody) {
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

  return localUnEvalTree;
};

class InvalidSyntaxError extends Error {}

function assertJSObjectSyntax(objectString: string) {
  const regex = new RegExp(/^export default[\s]*?({[\s\S]*?})/);
  if (!regex.test(objectString))
    throw new InvalidSyntaxError("JSObject should start with export default");
  return true;
}

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
export async function saveResolvedFunctionsAndJSUpdates(
  dataTreeEvalRef: DataTreeEvaluator,
  entity: DataTreeJSAction,
  jsUpdates: Record<string, JSUpdate>,
  unEvalDataTree: DataTree,
  entityName: string,
) {
  try {
    assertJSObjectSyntax(entity.body);
    const body = entity.body.replace(/export default/g, "");
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
    const actions: any = [];
    const variables: any = [];
    if (parsedObject) {
      for (const parsedElement of parsedObject) {
        if (isTypeOfFunction(parsedElement.type)) {
          try {
            const { result } = await evaluate(
              parsedElement.value,
              unEvalDataTree,
              {},
              true,
              undefined,
              undefined,
              true,
            );
            if (result) {
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
      }
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
    if (e instanceof InvalidSyntaxError) {
      const errors = {
        type: EvalErrorTypes.PARSE_JS_ERROR,
        context: {
          entity: entity,
          propertyPath: `${entity.name}.body`,
        },
        message: "Start object with export default",
      };
      dataTreeEvalRef.errors.push(errors);
    }
  }
}

export async function parseJSActions(
  dataTreeEvalRef: DataTreeEvaluator,
  unEvalDataTree: DataTree,
  differences?: DataTreeDiff[],
  oldUnEvalTree?: DataTree,
) {
  const jsUpdates: Record<string, JSUpdate> = {};
  if (!!differences && !!oldUnEvalTree) {
    for (const diff of differences) {
      const { entityName, propertyPath } = getEntityNameAndPropertyPath(
        diff.payload.propertyPath,
      );
      const entity = unEvalDataTree[entityName];

      if (!isJSAction(entity)) continue;

      if (diff.event === DataTreeDiffEvent.DELETE) {
        // when JSObject is deleted, we remove it from currentJSCollectionState & resolvedFunctions
        if (
          dataTreeEvalRef.currentJSCollectionState &&
          dataTreeEvalRef.currentJSCollectionState[diff.payload.propertyPath]
        ) {
          delete dataTreeEvalRef.currentJSCollectionState[
            diff.payload.propertyPath
          ];
        }
        if (
          dataTreeEvalRef.resolvedFunctions &&
          dataTreeEvalRef.resolvedFunctions[diff.payload.propertyPath]
        ) {
          delete dataTreeEvalRef.resolvedFunctions[diff.payload.propertyPath];
        }
      }

      if (
        (diff.event === DataTreeDiffEvent.EDIT && propertyPath === "body") ||
        (diff.event === DataTreeDiffEvent.NEW && propertyPath === "")
      ) {
        await saveResolvedFunctionsAndJSUpdates(
          dataTreeEvalRef,
          entity,
          jsUpdates,
          unEvalDataTree,
          entityName,
        );
      }
    }
  } else {
    for (const entityName of Object.keys(unEvalDataTree)) {
      const entity = unEvalDataTree[entityName];
      if (!isJSAction(entity)) continue;
      await saveResolvedFunctionsAndJSUpdates(
        dataTreeEvalRef,
        entity,
        jsUpdates,
        unEvalDataTree,
        entityName,
      );
    }
  }
  for (const entityName of Object.keys(jsUpdates)) {
    const parsedBody = jsUpdates[entityName].parsedBody;
    if (!parsedBody) continue;
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
