import { Diff, diff } from "deep-diff";
import { DataTree, DataTreeJSAction } from "entities/DataTree/dataTreeFactory";
import { flatten, set, unset } from "lodash";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";
import { JSUpdate, ParsedJSSubAction } from "utils/JSPaneUtils";
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
export function saveResolvedFunctionsAndJSUpdates(
  dataTreeEvalRef: DataTreeEvaluator,
  entity: DataTreeJSAction,
  jsUpdates: Record<string, JSUpdate>,
  entityName: string,
) {
  const correctFormat = regex.test(entity.body);
  if (correctFormat) {
    try {
      // delete previous function
      unset(dataTreeEvalRef.resolvedFunctions, entityName);

      const actionConfigs = Object.values(entity.actionsConfig);
      const actions: any = [];
      const variables = entity.variables.map((variableName) => ({
        variableName: entity.properties[variableName],
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
              parsedFunction: result,
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
      // When parsing fails
      // } else {
      //   set(jsUpdates, `${entityName}`, {
      //     parsedBody: undefined,
      //     id: entity.actionId,
      //   });
      // }
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

export function parseJSActions(
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
  if (!!differences && !!oldUnEvalTree) {
    differences.forEach((diff) => {
      const { entityName, propertyPath } = getEntityNameAndPropertyPath(
        diff.payload.propertyPath,
      );
      const entity = unEvalDataTree[entityName];

      if (!isJSAction(entity)) {
        return false;
      }

      if (diff.event === DataTreeDiffEvent.DELETE) {
        // when JSObject is deleted, we remove it from resolvedFunctions
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
        jsUpdates = saveResolvedFunctionsAndJSUpdates(
          dataTreeEvalRef,
          entity,
          jsUpdates,
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
