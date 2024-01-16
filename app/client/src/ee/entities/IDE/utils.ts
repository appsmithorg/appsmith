export * from "ce/entities/IDE/utils";
import { EDITOR_PATHS as CE_EDITOR_PATHS } from "ce/entities/IDE/utils";
import { MODULE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";

export const EDITOR_PATHS = [...CE_EDITOR_PATHS, MODULE_EDITOR_PATH];
