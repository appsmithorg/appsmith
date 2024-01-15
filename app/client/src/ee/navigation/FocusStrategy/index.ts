export * from "ce/navigation/FocusStrategy";

import type { IDEType } from "@appsmith/entities/IDE/constants";
import { IDE_TYPE } from "@appsmith/entities/IDE/constants";
import { AppIDEFocusStrategy } from "ce/navigation/FocusStrategy/AppIDEFocusStrategy";
import { NoIDEFocusStrategy } from "ce/navigation/FocusStrategy/NoIDEFocusStrategy";
import { PackageFocusStrategy } from "@appsmith/navigation/FocusStrategy/PackageFocusStrategy";
import { WorkflowFocusStrategy } from "@appsmith/navigation/FocusStrategy/WorkflowFocusStrategy";

export const getIDEFocusStrategy = (type: IDEType) => {
  switch (type) {
    case IDE_TYPE.None:
      return NoIDEFocusStrategy;
    case IDE_TYPE.App:
      return AppIDEFocusStrategy;
    // Add EE cases below
    case IDE_TYPE.Package:
      return PackageFocusStrategy;
    case IDE_TYPE.Workflow:
      return WorkflowFocusStrategy;
    default:
      throw Error("Ide focus strategy not defined");
  }
};
