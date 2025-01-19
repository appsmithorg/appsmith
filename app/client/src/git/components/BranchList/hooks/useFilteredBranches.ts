import type { GitBranch } from "git/types";
import { useEffect, useState } from "react";

export function useFilteredBranches(
  branches: Array<GitBranch>,
  searchText: string,
) {
  const lowercaseSearchText = searchText.toLowerCase();
  const [filteredBranches, setFilteredBranches] = useState<Array<string>>([]);

  useEffect(
    function setFilteredBranchesEffect() {
      const matched = branches.filter((b) =>
        lowercaseSearchText
          ? b.branchName.toLowerCase().includes(lowercaseSearchText)
          : true,
      );
      const branchNames = [
        ...matched.filter((b) => b.default),
        ...matched.filter((b) => !b.default),
      ].map((b) => b.branchName);

      setFilteredBranches(branchNames);
    },
    [branches, lowercaseSearchText],
  );

  return filteredBranches;
}
