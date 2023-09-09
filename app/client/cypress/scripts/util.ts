interface DataItem {
  name: string;
  duration: string;
}
export function divideSpecsIntoBalancedGroups(
  data: DataItem[],
  numberOfGroups: number,
): DataItem[][] {
  // Sort data by duration in descending order
  const sortedData = [...data].sort(
    (a, b) => Number(b.duration) - Number(a.duration),
  );

  const groups: DataItem[][] = Array.from({ length: numberOfGroups }, () => []);
  sortedData.forEach((item) => {
    // Find the group with the shortest total duration and add the item to it
    const shortestGroupIndex = groups.reduce(
      (minIndex, group, currentIndex) => {
        const totalDurationMin = groups[minIndex].reduce(
          (acc, item) => acc + Number(item.duration),
          0,
        );
        const totalDurationCurrent = group.reduce(
          (acc, item) => acc + Number(item.duration),
          0,
        );
        return totalDurationCurrent < totalDurationMin
          ? currentIndex
          : minIndex;
      },
      0,
    );
    groups[shortestGroupIndex].push(item);
  });
  return groups;
}
