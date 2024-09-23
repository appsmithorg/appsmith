import { getSearchQuery } from "utils/helpers";
import type { Location } from "history";

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

export const addClassToDocumentRoot = (className: string) => {
  const element: HTMLElement | null = document.querySelector("#root");

  if (!!element) {
    element.classList.add(className);
  }
};

export const removeClassFromDocumentRoot = (className: string) => {
  const element: HTMLElement | null = document.querySelector("#root");

  if (!!element) {
    element.classList.remove(className);
  }
};
