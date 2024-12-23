import type { Branch } from "entities/GitSync";
import { useEffect, useState } from "react";

export function useFilteredBranches(
  branches: Array<Branch>,
  searchText: string,
) {
  const lowercaseSearchText = searchText.toLowerCase();
  const [filteredBranches, setFilteredBranches] = useState<Array<string>>([]);

  useEffect(
    function setFilteredBranchesEffect() {
      const matched = branches.filter((b: Branch) =>
        lowercaseSearchText
          ? b.branchName.toLowerCase().includes(lowercaseSearchText)
          : true,
      );
      const branchNames = [
        ...matched.filter((b: Branch) => b.default),
        ...matched.filter((b: Branch) => !b.default),
      ].map((b: Branch) => b.branchName);

      setFilteredBranches(branchNames);
    },
    [branches, lowercaseSearchText],
  );

  return filteredBranches;
}
