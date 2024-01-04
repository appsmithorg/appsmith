export * from "ce/constants/routes/appRoutes";
import {
  BUILDER_PATH,
  basePathForActiveAction as CE_basePathForActiveAction,
  DATA_SOURCES_EDITOR_ID_PATH,
  SAAS_GSHEET_EDITOR_ID_PATH,
} from "ce/constants/routes/appRoutes";
import { MODULE_EDITOR_PATH, PACKAGE_EDITOR_PATH } from "./packageRoutes";
import { matchPath } from "react-router";

export const matchDatasourcePath = (pathname: string) =>
  matchPath(pathname, {
    path: [
      `${BUILDER_PATH}${DATA_SOURCES_EDITOR_ID_PATH}`,
      `${PACKAGE_EDITOR_PATH}${DATA_SOURCES_EDITOR_ID_PATH}`,
      `${MODULE_EDITOR_PATH}${DATA_SOURCES_EDITOR_ID_PATH}`,
    ],
    strict: false,
    exact: false,
  });

export const matchSAASGsheetsPath = (pathname: string) =>
  matchPath(pathname, {
    path: [
      `${BUILDER_PATH}${SAAS_GSHEET_EDITOR_ID_PATH}`,
      `${PACKAGE_EDITOR_PATH}${SAAS_GSHEET_EDITOR_ID_PATH}`,
      `${MODULE_EDITOR_PATH}${SAAS_GSHEET_EDITOR_ID_PATH}`,
    ],
    strict: false,
    exact: false,
  });

export const MODULE_INSTANCE_ID_PATH = "/module-instance/:moduleInstanceId";

export const basePathForActiveAction = [
  ...CE_basePathForActiveAction,
  MODULE_EDITOR_PATH,
];
