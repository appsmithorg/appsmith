import { Branch } from "entities/GitSync";
import { useEffect, useState } from "react";

/**
 * useFilteredBranches: returns list of branchName: string
 * If param searchText is provided, then filters list based on input text.
 * If not, then all of the list is returned.
 * It both cases, the default branch is pushed to the top
 * @param branches {Branch[]}
 * @param searchText {string}
 * @returns {string[]}
 */
export const useFilteredBranches = (
  branches: Array<Branch>,
  searchText: string,
) => {
  searchText = searchText.toLowerCase();
  const [filteredBranches, setFilteredBranches] = useState<Array<string>>([]);
  useEffect(() => {
    const matched = branches.filter((b: Branch) =>
      searchText ? b.branchName.toLowerCase().includes(searchText) : true,
    );
    const branchNames = [
      ...matched.filter((b: Branch) => b.default),
      ...matched.filter((b: Branch) => !b.default),
    ].map((b: Branch) => b.branchName);

    setFilteredBranches(branchNames);
  }, [branches, searchText]);
  return filteredBranches;
};
