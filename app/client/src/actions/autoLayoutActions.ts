import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { LayoutDirection } from "components/constants";

export const removeWrappers = (parentId: string) => ({
  type: ReduxActionTypes.REMOVE_CHILD_WRAPPERS,
  payload: { parentId },
});

export const addWrappers = (parentId: string, direction: LayoutDirection) => ({
  type: ReduxActionTypes.ADD_CHILD_WRAPPERS,
  payload: {
    parentId,
    direction,
  },
});

export const updateWrappers = (
  parentId: string,
  direction: LayoutDirection,
) => ({
  type: ReduxActionTypes.UPDATE_WRAPPER_DIMENSIONS,
  payload: {
    parentId,
    direction,
  },
});
