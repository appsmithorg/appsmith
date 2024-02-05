export * from "ce/constants/routes/appRoutes";
import {
  APP_SETTINGS_EDITOR_PATH,
  BUILDER_PATH,
  basePathForActiveAction as CE_basePathForActiveAction,
  DATA_SOURCES_EDITOR_ID_PATH,
  QUERIES_EDITOR_ID_PATH,
  SAAS_GSHEET_EDITOR_ID_PATH,
} from "ce/constants/routes/appRoutes";
import { MODULE_EDITOR_PATH, PACKAGE_EDITOR_PATH } from "./packageRoutes";
import { matchPath } from "react-router";
import { WorkflowSettingsTabs } from "@appsmith/pages/Editor/WorkflowEditor/WorkflowSettingsPane/WorkflowSettings";
import { WORKFLOW_EDITOR_URL } from "./workflowRoutes";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { match } = require("path-to-regexp");

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

export const MODULE_INSTANCE_ID_PATH =
  "/module-instance/:moduleType/:moduleInstanceId";

export const basePathForActiveAction = [
  ...CE_basePathForActiveAction,
  MODULE_EDITOR_PATH,
  WORKFLOW_EDITOR_URL,
];

export const WORKFLOW_TRIGGER_SETTINGS_PATH = (path: string) =>
  `${path}${APP_SETTINGS_EDITOR_PATH}/${WorkflowSettingsTabs.Trigger}`;

export const WORKFLOW_GENERAL_SETTINGS_PATH = (path: string) =>
  `${path}${APP_SETTINGS_EDITOR_PATH}/${WorkflowSettingsTabs.General}`;

export const WORKFLOW_SETTINGS_PATHS = (path: string) => [
  `${path}${APP_SETTINGS_EDITOR_PATH}`,
  WORKFLOW_GENERAL_SETTINGS_PATH(path),
  WORKFLOW_TRIGGER_SETTINGS_PATH(path),
];

export const matchQueryBuilderPath =
  match(BUILDER_PATH + QUERIES_EDITOR_ID_PATH) ||
  match(MODULE_EDITOR_PATH + QUERIES_EDITOR_ID_PATH);
