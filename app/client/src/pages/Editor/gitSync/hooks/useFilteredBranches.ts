// filter the branches according to the search text
// also pushes the default branch to the top
import { Branch } from "../../../../entities/GitSync";
import { useEffect, useState } from "react";

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
