import { FocusEntity } from "navigation/FocusableEntity";

export type FocusInformation = {
  entity: FocusEntity;
  name: string;
  parent: string;
};

export interface FocusableElement {
  childFocusElements: FocusableElement[];
  getElementInformation: () => FocusInformation;
  focus: () => void;
  storeLastState: () => void;
}

export type cursorState = {
  ln: number;
  ch: number;
};

export type evaluatedPaneState = {
  structure: boolean;
  example: boolean;
  value: boolean;
};

export interface FocusableInput extends FocusableElement {
  storeCursorState: (
    cursorState: cursorState,
    evaluatedState: evaluatedPaneState,
  ) => void;
}

export const useFocusable = () => {
  // create hook here
};
