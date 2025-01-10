import type {
  Diff,
  DiffArray,
  DiffDeleted,
  DiffEdit,
  DiffNew,
} from "deep-diff";
import { isEmpty, partition } from "lodash";

export function groupDifferencesByType(differences: Array<Diff<unknown>>): {
  edits: Array<DiffEdit<unknown, unknown>>;
  additions: Array<DiffNew<unknown>>;
  deletions: Array<DiffDeleted<unknown>>;
} {
  if (isEmpty(differences)) return { edits: [], additions: [], deletions: [] };

  const [edits, others] = partition(differences, (diff) => diff.kind === "E");
  const [additions, deletionsAndArrayChanges] = partition(
    others,
    (diff) => diff.kind === "N",
  );
  const [deletions, arrayChanges] = partition(
    deletionsAndArrayChanges,
    (diff) => diff.kind === "D",
  );

  const refinedChanges = (arrayChanges as DiffArray<unknown>[]).reduce(
    (acc, currentDiff) => {
      if (!currentDiff.path) return acc;

      const { index, item, path } = currentDiff;

      return [
        ...acc,
        {
          ...item,
          path: [...path, index],
        },
      ];
    },
    [] as Diff<unknown>[],
  );

  const result = groupDifferencesByType(refinedChanges);

  return {
    edits: edits.concat(result.edits),
    additions: additions.concat(result.additions),
    deletions: deletions.concat(result.deletions),
  };
}
