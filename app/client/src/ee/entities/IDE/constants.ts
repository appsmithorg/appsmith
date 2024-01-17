export * from "ce/entities/IDE/constants";
import {
  IDE_TYPE as CE_IDE_TYPE,
  IDEBasePaths as CE_IDEBasePaths,
} from "ce/entities/IDE/constants";
import {
  MODULE_EDITOR_PATH,
  PACKAGE_EDITOR_PATH,
} from "@appsmith/constants/routes/packageRoutes";
import { WORKFLOW_EDITOR_URL } from "@appsmith/constants/routes/workflowRoutes";

export const IDE_TYPE = {
  ...CE_IDE_TYPE,
  Package: "Package",
  Workflow: "Workflow",
} as const;

export type IDEType = keyof typeof IDE_TYPE;

export const IDEBasePaths: Readonly<Record<IDEType, string[]>> = {
  ...CE_IDEBasePaths,
  [IDE_TYPE.Package]: [PACKAGE_EDITOR_PATH, MODULE_EDITOR_PATH],
  [IDE_TYPE.Workflow]: [WORKFLOW_EDITOR_URL],
};
