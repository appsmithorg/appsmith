import { AnvilReduxActionTypes } from "./actionTypes";

export const readLayoutElementPositions = () => {
  return {
    type: AnvilReduxActionTypes.READ_LAYOUT_ELEMENT_POSITIONS,
  };
};

export const deleteLayoutElementPositions = (elements: string[]) => {
  return {
    type: AnvilReduxActionTypes.REMOVE_LAYOUT_ELEMENT_POSITIONS,
    payload: elements,
  };
};
