export * from "ce/constants/routes/appRoutes";
import { basePathForActiveAction as CE_basePathForActiveAction } from "ce/constants/routes/appRoutes";
import { MODULE_EDITOR_PATH } from "./packageRoutes";

export const MODULE_INSTANCE_ID_PATH = "/module-instance/:moduleInstanceId";

export const basePathForActiveAction = [
  ...CE_basePathForActiveAction,
  MODULE_EDITOR_PATH,
];
