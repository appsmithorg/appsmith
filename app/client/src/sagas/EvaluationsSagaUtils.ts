import type {
  BufferedReduxAction,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { AFFECTED_JS_OBJECTS_FNS } from "@appsmith/sagas/InferAffectedJSObjects";
import { isJSAction } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { UnEvalTree } from "entities/DataTree/dataTreeTypes";
import log from "loglevel";
import type { DiffWithNewTreeState } from "workers/Evaluation/helpers";
import { getJSEntities } from "workers/Evaluation/JSObject";

export const parseUpdatesAndDeleteUndefinedUpdates = (
  updates: string,
): DiffWithNewTreeState[] => {
  let parsedUpdates = [];
  try {
    //Parse updates from a string
    parsedUpdates = JSON.parse(updates);
  } catch (e) {
    log.error("Failed to parse updates", e, updates);
    return [];
  }

  //delete all undefined properties from the state
  const { deleteUpdates, regularUpdates } = parsedUpdates.reduce(
    (acc: any, curr: any) => {
      const { kind, path, rhs } = curr;

      if (rhs === undefined) {
        //ignore any new undefined updates to the state if the value is undefined
        if (kind === "N") {
          return acc;
        }
        //convert undefined updates to delete updates
        if (kind === "E") {
          acc.deleteUpdates.push({ kind: "D", path });
          return acc;
        }
      }

      acc.regularUpdates.push(curr);
      return acc;
    },
    { regularUpdates: [], deleteUpdates: [] },
  );

  const consolidatedUpdates = [...regularUpdates, ...deleteUpdates];
  return consolidatedUpdates;
};

export interface AffectedJSObjects {
  ids: string[];
  isAllAffected: boolean;
}

const mergeAffectedJSObjects = (
  action: ReduxAction<unknown> | BufferedReduxAction<unknown>,
) => {
  return AFFECTED_JS_OBJECTS_FNS.reduce(
    (acc, affectedJSObjectsFn) => {
      // when either of the action isAllJSObjectsAffected return true.
      // In this case perform diff on all js objects
      if (acc.isAllAffected) {
        return acc;
      }
      acc = {
        isAllAffected:
          acc.isAllAffected || affectedJSObjectsFn(action).isAllAffected,
        ids: [...acc.ids, ...affectedJSObjectsFn(action).ids],
      };

      return acc;
    },
    { ids: [], isAllAffected: false } as AffectedJSObjects,
  );
};
// Infer from an action the JSObjects that are affected by a Redux action.
export function getAffectedJSObjectIdsFromAction(
  action: ReduxAction<unknown> | BufferedReduxAction<unknown>,
): AffectedJSObjects {
  if (!action)
    return {
      ids: [],
      isAllAffected: false,
    };

  return mergeAffectedJSObjects(action);
}

export const seperateOutAffectedJSactions = (
  unevalTree: UnEvalTree,
  affectedJSObjects: AffectedJSObjects,
) => {
  const { ids, isAllAffected } = affectedJSObjects;

  const unevalTreeWithoutJSObjects = Object.keys(unevalTree).reduce(
    (acc, entityId) => {
      const entityData = unevalTree[entityId];
      if (isJSAction(entityData)) {
        return acc;
      }
      acc[entityId] = entityData;
      return acc;
    },
    {} as UnEvalTree,
  );
  const jsObjects = getJSEntities(unevalTree);

  const allJSObjects = Object.keys(jsObjects).map((key) => ({
    path: key,
    value: jsObjects[key],
  }));

  if (isAllAffected) {
    return {
      unevalTreeWithoutJSObjects,
      jsPatches: {
        shouldReplaceAllNodes: true,
        patches: allJSObjects,
      },
    };
  }
  const affectedIdsSet = new Set(ids);
  return {
    unevalTreeWithoutJSObjects,
    jsPatches: {
      shouldReplaceAllNodes: false,
      patches: allJSObjects.filter((v: any) =>
        affectedIdsSet.has(v.value.actionId),
      ),
    },
  };
};
