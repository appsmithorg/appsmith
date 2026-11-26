export interface DataItem {
  name: string;
  // spec_avg_duration hands back milliseconds; the pg driver may type them as either.
  duration: string | number;
}

// Weight assumed for a spec that has no usable row in the spec_avg_duration view.
export const DEFAULT_SPEC_DURATION_MS = 180000;

export function specDurationMs(item: DataItem): number {
  const duration = Number(item.duration);

  return Number.isFinite(duration) && duration > 0
    ? duration
    : DEFAULT_SPEC_DURATION_MS;
}

/**
 * Packs specs into `numberOfGroups` groups of roughly equal total duration.
 *
 * Specs are placed heaviest first, each onto the group with the smallest running
 * total. A run waits on its slowest group, so the heaviest specs have to be placed
 * while the groups are still empty — a long spec that arrives once every group is
 * loaded has nowhere cheap to go. Ties break on name, so the same input always
 * produces the same groups.
 */
export function divideSpecsIntoBalancedGroups(
  data: DataItem[],
  numberOfGroups: number,
): DataItem[][] {
  if (numberOfGroups < 1) {
    return [];
  }

  const groups: DataItem[][] = Array.from({ length: numberOfGroups }, () => []);
  const totals: number[] = new Array(numberOfGroups).fill(0);

  const heaviestFirst = [...data].sort(
    (a, b) =>
      specDurationMs(b) - specDurationMs(a) || a.name.localeCompare(b.name),
  );

  heaviestFirst.forEach((item) => {
    let shortestGroupIndex = 0;

    for (let index = 1; index < numberOfGroups; index++) {
      if (totals[index] < totals[shortestGroupIndex]) {
        shortestGroupIndex = index;
      }
    }

    groups[shortestGroupIndex].push(item);
    totals[shortestGroupIndex] += specDurationMs(item);
  });

  return groups;
}
