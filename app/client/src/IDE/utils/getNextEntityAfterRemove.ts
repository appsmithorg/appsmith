import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";
import { identifyEntityFromPath } from "navigation/FocusEntity";

/**
 * Adds custom redirect logic to redirect after an item is deleted
 * 1. Do not navigate if the deleted item is not selected
 * 2. If it was the only item, navigate to the list url, to show the blank state
 * 3. If there are other items, navigate to an item close to the current one
 * **/

export enum RedirectAction {
  NA = "NA", // No action is needed
  LIST = "LIST", // Navigate to a creation URL
  ITEM = "ITEM", // Navigate to this item
}

interface RedirectActionDescription<T> {
  action: RedirectAction;
  payload?: T;
}

export function getNextEntityAfterRemove<T extends EntityItem>(
  removedId: string,
  tabs: T[],
): RedirectActionDescription<T> {
  const currentSelectedEntity = identifyEntityFromPath(
    window.location.pathname,
  );
  const isSelectedActionRemoved = currentSelectedEntity.id === removedId;

  // If removed item is not currently selected, don't redirect
  if (!isSelectedActionRemoved) {
    return {
      action: RedirectAction.NA,
    };
  }

  const indexOfTab = tabs.findIndex((item) => item.key === removedId);

  switch (indexOfTab) {
    case -1:
      // If no other action is remaining, navigate to the creation url
      return {
        action: RedirectAction.LIST,
      };
    case 0:
      // if the removed item is first item, then if tabs present, tabs + 1
      // else otherItems[0] -> TODO: consider changing this logic after discussion with
      // design team. May be new listing UI for side by side
      if (tabs.length > 1) {
        return {
          action: RedirectAction.ITEM,
          payload: tabs[1],
        };
      } else {
        return {
          action: RedirectAction.LIST,
        };
      }
    default:
      return {
        action: RedirectAction.ITEM,
        payload: tabs[indexOfTab - 1],
      };
  }
}
