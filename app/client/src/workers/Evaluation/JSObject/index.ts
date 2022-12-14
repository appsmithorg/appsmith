import { DataTree, DataTreeJSAction } from "entities/DataTree/dataTreeFactory";
import { isEmpty, set } from "lodash";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";
import { JSUpdate, ParsedJSSubAction } from "utils/JSPaneUtils";
import { NodeTypes, parseJSObjectWithAST, JsObjectProperty } from "@shared/ast";
import DataTreeEvaluator from "workers/common/DataTreeEvaluator";
import evaluateSync, { isFunctionAsync } from "workers/Evaluation/evaluate";
import {
  DataTreeDiff,
  DataTreeDiffEvent,
  getEntityNameAndPropertyPath,
  isJSAction,
} from "workers/Evaluation/evaluationUtils";
import {
  removeFunctionsAndVariableJSCollection,
  updateJSCollectionInUnEvalTree,
} from "workers/Evaluation/JSObject/utils";

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
          // add/delete/update functions from dataTree
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

function deleteResolvedFunctionsAndCurrentJSCollectionState(
  dataTreeEvalRef: DataTreeEvaluator,
  entityName: string,
) {
  delete dataTreeEvalRef.resolvedFunctions[entityName];
  delete dataTreeEvalRef.currentJSCollectionState[entityName];
}

function parseFunction(
  parsedElement: JsObjectProperty,
  unEvalDataTree: DataTree,
  dataTreeEvalRef: DataTreeEvaluator,
  entityName: string,
  actions: Actions[],
) {
  const { result } = evaluateSync(
    parsedElement.value,
    unEvalDataTree,
    {},
    true,
    undefined,
    undefined,
    true,
  );
  if (!!result) {
    let params: Array<{ key: string; value: unknown }> = [];

    if (parsedElement.arguments) {
      params = parsedElement.arguments.map(({ defaultValue, paramName }) => ({
        key: paramName,
        value: defaultValue,
      }));
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
}

function parseVariables(
  variables: Variables[],
  parsedElement: JsObjectProperty,
  dataTreeEvalRef: DataTreeEvaluator,
  entityName: string,
) {
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

function getParsedBody(
  parsedObject: Array<JsObjectProperty>,
  unEvalDataTree: DataTree,
  dataTreeEvalRef: DataTreeEvaluator,
  entityName: string,
) {
  const actions: Actions[] = [];
  const variables: Variables[] = [];
  for (const parsedElement of parsedObject) {
    switch (parsedElement.type) {
      case "literal":
        continue;
      case NodeTypes.ArrowFunctionExpression:
      case NodeTypes.FunctionExpression:
        parseFunction(
          parsedElement,
          unEvalDataTree,
          dataTreeEvalRef,
          entityName,
          actions,
        );
        break;
      default:
        parseVariables(variables, parsedElement, dataTreeEvalRef, entityName);
    }
  }
  return {
    actions,
    variables,
  };
}

/**
 * Here we parse the JSObject and then determine
 * 1. it's nature : async or sync
 * 2. Find arguments of JS Actions
 * 3. set variables and actions in currentJSCollectionState and resolvedFunctions
 *
 * @param dataTreeEvalRef
 * @param entity
 * @param unEvalDataTree
 * @param entityName
 * @param jsUpdates
 * @returns
 */
export function saveResolvedFunctionsAndJSUpdates(
  dataTreeEvalRef: DataTreeEvaluator,
  entity: DataTreeJSAction,
  unEvalDataTree: DataTree,
  entityName: string,
  jsUpdates: Record<string, JSUpdate>,
) {
  const correctFormat = regex.test(entity.body);
  if (correctFormat) {
    const body = entity.body.replace(/export default/g, "");
    try {
      deleteResolvedFunctionsAndCurrentJSCollectionState(
        dataTreeEvalRef,
        entityName,
      );
      const parseStartTime = performance.now();
      const parsedObject = parseJSObjectWithAST(body);
      const parseEndTime = performance.now();
      const JSObjectASTParseTime = parseEndTime - parseStartTime;
      dataTreeEvalRef.logs.push({
        JSObjectName: entityName,
        JSObjectASTParseTime,
      });

      const parsedBody = !!parsedObject
        ? {
            body: entity.body,
            ...getParsedBody(
              parsedObject,
              unEvalDataTree,
              dataTreeEvalRef,
              entityName,
            ),
          }
        : undefined;

      set(jsUpdates, `${entityName}`, {
        parsedBody,
        id: entity.actionId,
      });
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

export function viewModeSaveResolvedFunctions(
  dataTreeEvalRef: DataTreeEvaluator,
  entity: DataTreeJSAction,
  unEvalDataTree: DataTree,
  entityName: string,
) {
  try {
    deleteResolvedFunctionsAndCurrentJSCollectionState(
      dataTreeEvalRef,
      entityName,
    );
    const jsActions = entity.meta;
    const jsActionList = Object.keys(jsActions);
    for (const jsAction of jsActionList) {
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
    }
  } catch (e) {
    //if we need to push error as popup in case
  }
}

export function parseJSActionsWithDifferences(
  dataTreeEvalRef: DataTreeEvaluator,
  unEvalDataTree: DataTree,
  differences: DataTreeDiff[],
) {
  let jsUpdates: Record<string, JSUpdate> = {};
  for (const diff of differences) {
    const payLoadPropertyPath = diff.payload.propertyPath;
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(
      payLoadPropertyPath,
    );
    const entity = unEvalDataTree[entityName];

    if (!isJSAction(entity)) {
      continue;
    }

    switch (diff.event) {
      case DataTreeDiffEvent.DELETE:
        // when JSObject is deleted, we remove it from currentJSCollectionState & resolvedFunctions
        deleteResolvedFunctionsAndCurrentJSCollectionState(
          dataTreeEvalRef,
          payLoadPropertyPath,
        );
        break;
      case DataTreeDiffEvent.EDIT:
        if (propertyPath === "body") {
          jsUpdates = saveResolvedFunctionsAndJSUpdates(
            dataTreeEvalRef,
            entity,
            unEvalDataTree,
            entityName,
            jsUpdates,
          );
        }
        break;
      case DataTreeDiffEvent.NEW:
        if (propertyPath === "") {
          jsUpdates = saveResolvedFunctionsAndJSUpdates(
            dataTreeEvalRef,
            entity,
            unEvalDataTree,
            entityName,
            jsUpdates,
          );
        }
        break;
    }
  }
  return parseJSUpdates(jsUpdates, unEvalDataTree, dataTreeEvalRef);
}

export function parseJSActionsForViewMode(
  dataTreeEvalRef: DataTreeEvaluator,
  unEvalDataTree: DataTree,
) {
  const unEvalDataTreeKeys = Object.keys(unEvalDataTree);
  for (const entityName of unEvalDataTreeKeys) {
    const entity = unEvalDataTree[entityName];
    if (!isJSAction(entity)) {
      continue;
    }
    viewModeSaveResolvedFunctions(
      dataTreeEvalRef,
      entity,
      unEvalDataTree,
      entityName,
    );
  }
}

export function parseJSActions(
  dataTreeEvalRef: DataTreeEvaluator,
  unEvalDataTree: DataTree,
) {
  let jsUpdates: Record<string, JSUpdate> = {};
  const unEvalDataTreeKeys = Object.keys(unEvalDataTree);
  for (const entityName of unEvalDataTreeKeys) {
    const entity = unEvalDataTree[entityName];
    if (!isJSAction(entity)) {
      continue;
    }
    jsUpdates = saveResolvedFunctionsAndJSUpdates(
      dataTreeEvalRef,
      entity,
      unEvalDataTree,
      entityName,
      jsUpdates,
    );
  }
  return parseJSUpdates(jsUpdates, unEvalDataTree, dataTreeEvalRef);
}

export function parseJSUpdates(
  jsUpdates: Record<string, JSUpdate>,
  unEvalDataTree: DataTree,
  dataTreeEvalRef: DataTreeEvaluator,
) {
  const jsUpdateKeys = Object.keys(jsUpdates);
  for (const entityName of jsUpdateKeys) {
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
  return jsUpdates;
}

export function getJSEntities(dataTree: DataTree) {
  const jsCollections: Record<string, DataTreeJSAction> = {};
  const dataTreeKeys = Object.keys(dataTree);
  for (const key of dataTreeKeys) {
    const entity = dataTree[key];
    if (isJSAction(entity)) {
      jsCollections[entity.name] = entity;
    }
  }
  return jsCollections;
}
