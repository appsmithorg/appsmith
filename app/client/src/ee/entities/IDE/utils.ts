export * from "ce/entities/IDE/utils";
import { EDITOR_PATHS as CE_EDITOR_PATHS } from "ce/entities/IDE/utils";
import { MODULE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";
import { WORKFLOW_EDITOR_URL } from "@appsmith/constants/routes/workflowRoutes";

export const EDITOR_PATHS = [
  ...CE_EDITOR_PATHS,
  MODULE_EDITOR_PATH,
  WORKFLOW_EDITOR_URL,
];
