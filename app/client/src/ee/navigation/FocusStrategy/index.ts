export * from "ce/navigation/FocusStrategy";
import { IDE_TYPE, type IDEType } from "@appsmith/entities/IDE/constants";
import { AppIDEFocusStrategy } from "ce/navigation/FocusStrategy/AppIDEFocusStrategy";
import { NoIDEFocusStrategy } from "ce/navigation/FocusStrategy/NoIDEFocusStrategy";

export const getIDEFocusStrategy = (type: IDEType) => {
  switch (type) {
    case IDE_TYPE.None:
      return NoIDEFocusStrategy;
    case IDE_TYPE.App:
      return AppIDEFocusStrategy;
    case IDE_TYPE.Package:
      return NoIDEFocusStrategy;
    default:
      throw Error("Ide focus strategy not defined");
  }
};
