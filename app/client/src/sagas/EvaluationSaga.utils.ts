import log from "loglevel";
import type { DiffWithReferenceState } from "workers/Evaluation/helpers";

export const parseUpdatesAndDeleteUndefinedUpdates = (
  updates: string,
): DiffWithReferenceState[] => {
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
