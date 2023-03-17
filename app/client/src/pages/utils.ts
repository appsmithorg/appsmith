import { getSearchQuery } from "utils/helpers";
import { Location } from "history";

export const getIsBranchUpdated = (
  prevLocation: Location<unknown>,
  currentLocation: Location<unknown>,
) => {
  const { search: search1 } = prevLocation;
  const { search: search2 } = currentLocation;

  const branch1 = getSearchQuery(search1, "branch");
  const branch2 = getSearchQuery(search2, "branch");

  return branch1 !== branch2;
};
