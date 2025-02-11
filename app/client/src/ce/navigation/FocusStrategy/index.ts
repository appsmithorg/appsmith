import { IDE_TYPE, type IDEType } from "ee/IDE/Interfaces/IDETypes";
import { AppIDEFocusStrategy } from "./AppIDEFocusStrategy";
import { NoIDEFocusStrategy } from "./NoIDEFocusStrategy";

export const getIDEFocusStrategy = (type: IDEType) => {
  switch (type) {
    case IDE_TYPE.None:
      return NoIDEFocusStrategy;
    case IDE_TYPE.App:
      return AppIDEFocusStrategy;
    // Add EE cases below
    default:
      throw Error("Ide focus strategy not defined");
  }
};
