import type {
  BufferedReduxAction,
  ReduxAction,
} from "constants/ReduxActionTypes";
import { AFFECTED_JS_OBJECTS_FNS } from "ee/sagas/InferAffectedJSObjects";
import log from "loglevel";
import type { DiffWithNewTreeState } from "workers/Evaluation/helpers";

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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
