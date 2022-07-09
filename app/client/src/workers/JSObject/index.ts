import { Diff, diff } from "deep-diff";
import { DataTree, DataTreeJSAction } from "entities/DataTree/dataTreeFactory";
import { Variable } from "entities/JSCollection";
import { flatten, set, unset } from "lodash";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";
import { JSUpdate, ParsedFunction, ParsedJSSubAction } from "utils/JSPaneUtils";
import DataTreeEvaluator from "workers/DataTreeEvaluator";
import { isFunctionAsync } from "workers/evaluate";
import {
  DataTreeDiffEvent,
  getEntityNameAndPropertyPath,
  isJSAction,
  translateDiffEventToDataTreeDiffEvent,
} from "workers/evaluationUtils";
import { getJSEntities } from "./utils";

const regex = new RegExp(/^export default[\s]*?({[\s\S]*?})/);

/**
 * UPDATE THIS
 * Here we parse the JSObject and then determine
 * 1. it's nature : async or sync
 *
 * @param dataTreeEvalRef
 * @param entity
 * @param jsUpdates
 * @param unEvalDataTree
 * @param entityName
 * @returns
 */
export function updateResolvedFunctions(
  dataTreeEvalRef: DataTreeEvaluator,
  entity: DataTreeJSAction,
  jsUpdates: Record<string, JSUpdate>,
  entityName: string,
) {
  const correctFormat = regex.test(entity.body);
  if (correctFormat) {
    // delete resolved functions of this entity
    unset(dataTreeEvalRef.resolvedFunctions, entityName);

    const actionConfigs = Object.values(entity.actionsConfig);
    const actions: ParsedJSSubAction[] = [];
    const variables: Array<Variable> = entity.variables.map((variableName) => ({
      name: variableName,
      value: entity.properties[variableName],
    }));

    actionConfigs.forEach((action) => {
      try {
        // TODO: we will also need to save the returned data from action and set it into data field of action
        // this is to support response data getting saved
        const result = new Function(`return (${action.body})()`);

        if (!!result) {
          set(
            dataTreeEvalRef.resolvedFunctions,
            `${entityName}.${action.name}`,
            result,
          );

          actions.push({
            name: action.name,
            body: action.body,
            arguments: action.arguments,
            parsedFunction: result as ParsedFunction,
            isAsync: action.isAsync,
          });
        }
      } catch {
        // in case we need to handle error state
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
    // As parsing has moved to DataTreeJsAction
    // Figure out how to handle this error
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
/**
 * It checks if modified propertyPath is either
 * - `actionsConfig.functionName`: on function add or remove (or rename)
 *
 * OR
 * - `actionsConfig.functionName.body`: on function body edit
 * @param propertyPath
 * @returns
 */
const isJSActionsConfigEditPath = (propertyPath: string) => {
  const subPaths = propertyPath.split(".");
  switch (subPaths.length) {
    case 2:
      // on function add or remove, `actionsConfig.functionName` is modified
      if (subPaths[0] === "actionsConfig") {
        return true;
      }
      break;
    case 3:
      // on function edit, `actionsConfig.functionName.body` is modified
      if (subPaths[0] === "actionsConfig" && subPaths[2] === "body") {
        return true;
      }
      break;
  }
  return false;
};

export function getJSActionUpdates(
  dataTreeEvalRef: DataTreeEvaluator,
  unEvalDataTree: DataTree,
  oldUnEvalTree?: DataTree,
) {
  let differences;

  if (oldUnEvalTree) {
    //get difference in js collection body to be parsed
    const oldUnEvalTreeJSCollections = getJSEntities(oldUnEvalTree);
    const localUnEvalTreeJSCollection = getJSEntities(unEvalDataTree);
    const jsDifferences: Diff<
      Record<string, DataTreeJSAction>,
      Record<string, DataTreeJSAction>
    >[] = diff(oldUnEvalTreeJSCollections, localUnEvalTreeJSCollection) || [];

    differences = flatten(
      jsDifferences.map((diff) =>
        translateDiffEventToDataTreeDiffEvent(diff, unEvalDataTree),
      ),
    );
  }

  let jsUpdates: Record<string, JSUpdate> = {};
  if (!!oldUnEvalTree) {
    if (differences) {
      const modifiedJSObjectMap: Record<string, DataTreeJSAction> = {};
      differences.forEach((diff) => {
        const { entityName, propertyPath } = getEntityNameAndPropertyPath(
          diff.payload.propertyPath,
        );
        const entity = unEvalDataTree[entityName];
        const isJSObjectAction = isJSAction(entity);
        // Only if JSObject function's actionConfig is modified
        // then update resolved functions
        if (
          !isJSObjectAction ||
          (isJSObjectAction && !isJSActionsConfigEditPath(propertyPath))
        ) {
          return false;
        }

        if (
          diff.event === DataTreeDiffEvent.EDIT ||
          diff.event === DataTreeDiffEvent.NEW ||
          diff.event === DataTreeDiffEvent.DELETE
        ) {
          modifiedJSObjectMap[entityName] = entity;
        }
      });

      const modifiedJSObjects = Object.entries(modifiedJSObjectMap);

      if (modifiedJSObjects.length) {
        modifiedJSObjects.forEach(([entityName, entity]) => {
          jsUpdates = updateResolvedFunctions(
            dataTreeEvalRef,
            entity,
            jsUpdates,
            entityName,
          );
        });
      }
    }
  } else {
    // for create first tree we add resolved functions for each js object function
    Object.keys(unEvalDataTree).forEach((entityName) => {
      const entity = unEvalDataTree[entityName];
      if (!isJSAction(entity)) {
        return;
      }
      jsUpdates = updateResolvedFunctions(
        dataTreeEvalRef,
        entity,
        jsUpdates,
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

  return { jsUpdates };
}
