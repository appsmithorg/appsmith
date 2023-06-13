import type { Diff } from "deep-diff";
import { partition } from "lodash";

export function sortDifferencesByType(differences: Diff<unknown>[]) {
  const [edits, others] = partition(
    differences,
    (diff) => diff.kind === "E" || diff.kind === "A",
  );
  const [additions, deletions] = partition(others, (diff) => diff.kind === "N");
  return { edits, additions, deletions };
}
