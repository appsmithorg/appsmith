import { IDEType } from "@appsmith/entities/IDE/constants";
import { AppIDEFocusStrategy } from "./AppIDEFocusStrategy";
import { NoIDEFocusStrategy } from "./NoIDEFocusStrategy";

export const getIDEFocusStrategy = (type: IDEType) => {
  switch (type) {
    case IDEType.None:
      return NoIDEFocusStrategy;
    case IDEType.App:
      return AppIDEFocusStrategy;
    case IDEType.Package:
      // TODO
      break;
    case IDEType.Workflow:
      // TODO
      break;
  }
  throw Error("Ide focus strategy not defined");
};
