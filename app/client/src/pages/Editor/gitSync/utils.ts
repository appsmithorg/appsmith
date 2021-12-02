export const getShowRemoteSectionHeader = (
  filteredBranches: string[],
  index: number,
) => {
  const remotePrefix = "origin/";
  const prevIndex = index - 1;
  if (prevIndex < 0) return;
  return (
    !filteredBranches[prevIndex].startsWith(remotePrefix) &&
    filteredBranches[index].startsWith(remotePrefix)
  );
};
