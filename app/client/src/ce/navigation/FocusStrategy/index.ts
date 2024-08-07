import type { IDEType } from "ee/entities/IDE/constants";
import { IDE_TYPE } from "ee/entities/IDE/constants";
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
