import { useEffect, useState } from "react";

export const useActiveHoverIndex = (
  currentBranch: string | undefined,
  filteredBranches: Array<string>,
  isCreateNewBranchInputValid: boolean,
) => {
  const effectiveLength = isCreateNewBranchInputValid
    ? filteredBranches.length
    : filteredBranches.length - 1;

  const [activeHoverIndex, setActiveHoverIndexInState] = useState(0);
  const setActiveHoverIndex = (index: number) => {
    if (index < 0) setActiveHoverIndexInState(effectiveLength);
    else if (index > effectiveLength) setActiveHoverIndexInState(0);
    else setActiveHoverIndexInState(index);
  };

  useEffect(() => {
    const activeBranchIdx = filteredBranches.indexOf(currentBranch || "");
    if (activeBranchIdx !== -1) {
      setActiveHoverIndex(
        isCreateNewBranchInputValid ? activeBranchIdx + 1 : activeBranchIdx,
      );
    } else {
      setActiveHoverIndex(0);
    }
  }, [currentBranch, filteredBranches, isCreateNewBranchInputValid]);

  return { activeHoverIndex, setActiveHoverIndex };
};
